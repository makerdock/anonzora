import { createElysia } from '../utils'
import { t } from 'elysia'
import { CreatePost } from '../actions/create-post'
import { CopyPostFarcaster } from '../actions/copy-post-farcaster'
import { CopyPostTwitter } from '../actions/copy-post-twitter'
import { DeletePostTwitter } from '../actions/delete-post-twitter'
import { DeletePostFarcaster } from '../actions/delete-post-farcaster'
import { BaseAction } from '../actions/base'
import {
  Action,
  ActionRequest,
  ActionType,
  getUsableCredential,
  validateCredentialRequirements,
} from '@anonworld/common'
import { db } from '../db'

export const CREDENTIAL_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 7 // 7 days

async function getActionInstance(request: ActionRequest) {
  const action = await db.actions.get(request.actionId)

  let actionInstance: BaseAction | undefined

  if (action.credential_requirement) {
    if (action.credential_id) {
      const credential = getUsableCredential(
        request.credentials,
        action as unknown as Action
      )
      if (!credential) {
        throw new Error('Missing required credential')
      }
    } else if (action.credentials) {
      for (const req of action.credentials) {
        const credential = validateCredentialRequirements(request.credentials, req)
        if (!credential) {
          throw new Error('Missing required credential')
        }
      }
    }
  }

  switch (action.type) {
    case ActionType.CREATE_POST: {
      actionInstance = new CreatePost(action, request.data, request.credentials)
      break
    }
    case ActionType.COPY_POST_TWITTER: {
      actionInstance = new CopyPostTwitter(action, request.data, request.credentials)
      break
    }
    case ActionType.COPY_POST_FARCASTER: {
      actionInstance = new CopyPostFarcaster(action, request.data, request.credentials)
      break
    }
    case ActionType.DELETE_POST_TWITTER: {
      actionInstance = new DeletePostTwitter(action, request.data, request.credentials)
      break
    }
    case ActionType.DELETE_POST_FARCASTER: {
      actionInstance = new DeletePostFarcaster(action, request.data, request.credentials)
      break
    }
  }

  return actionInstance
}

export const actionsRoutes = createElysia({ prefix: '/actions' })
  .get(
    '/',
    async ({ query }) => {
      const data = await db.actions.list(query.showHidden)
      return {
        data,
      }
    },
    {
      query: t.Object({
        showHidden: t.Optional(t.Boolean()),
      }),
    }
  )
  .get(
    '/:actionId',
    async ({ params }) => {
      const action = await db.actions.get(params.actionId)
      return action
    },
    {
      params: t.Object({
        actionId: t.String(),
      }),
    }
  )
  .post(
    '/execute',
    async ({ body }) => {
      const results: { success: boolean; error?: string }[] = []
      const nextActions: ActionRequest[] = []

      for (const action of body.actions) {
        try {
          const credentials = await db.credentials.getBulk(action.credentials)
          const actionInstance = await getActionInstance({
            ...action,
            credentials,
          })
          if (!actionInstance) {
            throw new Error('Invalid action')
          }

          const response = await actionInstance.execute()
          results.push(response)

          const next = await actionInstance.next()
          if (next.length > 0) {
            nextActions.push(...next)
          }
        } catch (error) {
          results.push({ success: false, error: (error as Error).message })
        }
      }

      for (const action of nextActions) {
        try {
          const actionInstance = await getActionInstance(action)
          if (!actionInstance) {
            throw new Error('Invalid action')
          }

          const response = await actionInstance.execute()
          results.push(response)
        } catch (error) {
          results.push({ success: false, error: (error as Error).message })
        }
      }

      const outOfMemoryResult = results.find((result) =>
        result.error?.toLowerCase().includes('out of memory')
      )
      if (outOfMemoryResult) {
        throw new Error(outOfMemoryResult.error)
      }

      return { results }
    },
    {
      body: t.Object({
        actions: t.Array(
          t.Object({
            actionId: t.String(),
            data: t.Any(),
            credentials: t.Array(t.String()),
          })
        ),
      }),
    }
  )
