import { createElysia } from '../utils'
import { error, t } from 'elysia'
import { toHex } from 'viem'
import { redis } from '../services/redis'
import { WebAuthnP256 } from 'ox'
import { notifications } from '../services/notifications'
import { db } from '../db'
import { DBVault } from '../db/types'
import { CredentialWithId } from '@anonworld/common'

export const authRoutes = createElysia({ prefix: '/auth' })
  .post(
    '/challenge',
    async ({ body }) => {
      const challenge = toHex(crypto.getRandomValues(new Uint8Array(32)))
      await redis.setVaultChallenge(body.nonce, challenge)
      return {
        challenge,
      }
    },
    {
      body: t.Object({
        nonce: t.String(),
      }),
    }
  )
  .post(
    '/create',
    async ({ jwt, body }) => {
      const challenge = await redis.getVaultChallenge(body.nonce)
      if (!challenge) {
        return { success: false }
      }

      const passkey = await db.passkeys.create({
        id: body.id,
        public_key: body.publicKey,
      })
      if (!passkey) {
        return { success: false }
      }

      await db.vaults.create({
        passkey_id: passkey.id,
      })

      const token = await jwt.sign({ passkeyId: passkey.id })

      return { success: true, token }
    },
    {
      body: t.Object({
        nonce: t.String(),
        id: t.String(),
        publicKey: t.Object({
          prefix: t.Number(),
          x: t.String(),
          y: t.String(),
        }),
      }),
    }
  )
  .post(
    '/authenticate',
    async ({ jwt, body }) => {
      const challenge = await redis.getVaultChallenge(body.nonce)
      if (!challenge) {
        return { success: false }
      }

      const passkey = await db.passkeys.get(body.raw.id)
      if (!passkey) {
        return { success: false }
      }

      const result = WebAuthnP256.verify({
        challenge: challenge as `0x${string}`,
        signature: {
          r: BigInt(body.signature.r),
          s: BigInt(body.signature.s),
          yParity: body.signature.yParity,
        },
        metadata: body.metadata,
        publicKey: {
          prefix: passkey.public_key.prefix,
          x: BigInt(passkey.public_key.x),
          y: BigInt(passkey.public_key.y),
        },
      })

      if (!result) {
        return { success: false }
      }

      const token = await jwt.sign({ passkeyId: passkey.id })

      return { success: true, token }
    },
    {
      body: t.Object({
        nonce: t.String(),
        raw: t.Object({
          id: t.String(),
          type: t.String(),
        }),
        signature: t.Object({
          r: t.String(),
          s: t.String(),
          yParity: t.Optional(t.Number()),
        }),
        metadata: t.Any(),
      }),
    }
  )
  .get('/vaults', async ({ passkeyId }) => {
    if (!passkeyId) {
      return { data: [] }
    }
    const response = await db.vaults.getForPasskey(passkeyId)
    const credentialsByVault = response.reduce(
      (acc, vault) => {
        if (!acc[vault.vaults.id]) {
          acc[vault.vaults.id] = {
            ...vault.vaults,
            credentials: [],
          }
        }
        if (vault.credential_instances) {
          acc[vault.vaults.id].credentials.push(vault.credential_instances)
        }
        return acc
      },
      {} as Record<string, DBVault & { credentials: CredentialWithId[] }>
    )
    return { data: Object.values(credentialsByVault) }
  })
  .post(
    '/posts/like',
    async ({ body, passkeyId, error }) => {
      if (!passkeyId) {
        return error(401, 'Unauthorized')
      }
      await db.posts.like(passkeyId, body.hash)
      return { success: true }
    },
    {
      body: t.Object({
        hash: t.String(),
      }),
    }
  )

  .post(
    '/posts/unlike',
    async ({ body, passkeyId, error }) => {
      if (!passkeyId) {
        return error(401, 'Unauthorized')
      }
      await db.posts.unlike(passkeyId, body.hash)
      return { success: true }
    },
    {
      body: t.Object({
        hash: t.String(),
      }),
    }
  )
  .get('/notifications', async ({ passkeyId }) => {
    if (!passkeyId) {
      return error(401, 'Unauthorized')
    }
    const vaults = await db.vaults.getForPasskey(passkeyId)
    if (vaults.length === 0) {
      return { data: [] }
    }

    const vaultId = vaults[0].vaults.id
    const replies = await notifications.getReplies(vaultId)
    return { data: replies }
  })
  .post(
    '/vaults/:id/settings',
    async ({ body, passkeyId, params, error }) => {
      if (!passkeyId) {
        return error(401, 'Unauthorized')
      }

      if (body.username) {
        if (!/^[a-zA-Z0-9_]+$/.test(body.username)) {
          return {
            success: false,
            error: 'Username can only contain letters, numbers and underscores',
          }
        }

        if (body.username.length > 15) {
          return { success: false, error: 'Username must be less than 15 characters' }
        }

        const vaultForUsername = await db.vaults.getForUsername(body.username)
        if (vaultForUsername && vaultForUsername.passkey_id !== passkeyId) {
          return { success: false, error: 'Username already taken' }
        }
      }

      await db.vaults.update(params.id, {
        image_url: body.imageUrl,
        username: body.username,
      })
      return { success: true }
    },
    {
      body: t.Object({
        imageUrl: t.Nullable(t.String()),
        username: t.Nullable(t.String()),
      }),
      params: t.Object({
        id: t.String(),
      }),
    }
  )
