import {
  bytesToHexString,
  createDefaultMetadataKeyInterceptor,
  getSSLHubRpcClient,
  HubEvent,
  HubEventType,
  MessageType,
  ReactionType,
} from '@farcaster/hub-nodejs'
import { redis } from '../src/services/redis'
import { db } from '../src/db'
import { DrizzleError } from 'drizzle-orm'

const client = getSSLHubRpcClient('hub-grpc-api.neynar.com', {
  interceptors: [
    createDefaultMetadataKeyInterceptor('x-api-key', process.env.NEYNAR_API_KEY!),
  ],
})

const getFidSets = async () => {
  const accounts = await db.socials.listFarcasterAccounts()
  const result = await client.getFids({ reverse: true })
  if (result.isErr()) {
    throw new Error('Failed to get fids')
  }
  const { fids } = result.value
  const maxFid = fids[0]
  const anonFids = new Set(accounts.map((account) => account.fid))

  const otherFids = new Set(
    Array.from({ length: maxFid }, (_, i) => i + 1).filter((fid) => !anonFids.has(fid))
  )

  return { anonworldFid: 899289, anonFids, otherFids, maxFid }
}

async function main() {
  const lastEventId = await redis.getLastEventId()
  const subscription = await client.subscribe({
    eventTypes: [HubEventType.MERGE_MESSAGE],
    ...(lastEventId && { fromId: Number(lastEventId) }),
  })

  if (!subscription.isOk()) {
    throw new Error('Failed to subscribe')
  }

  let sets = await getFidSets()

  let i = 0

  for await (const value of subscription.value) {
    const event = value as HubEvent
    if (event.type !== HubEventType.MERGE_MESSAGE) {
      continue
    }

    const message = event.mergeMessageBody?.message
    const messageData = message?.data
    if (!messageData) {
      continue
    }

    if (messageData.castAddBody) {
      const castAdd = messageData.castAddBody
      if (!castAdd.parentCastId) {
        continue
      }

      const fid = messageData.fid
      const parentFid = castAdd.parentCastId.fid
      if (parentFid > sets.maxFid) {
        sets = await getFidSets()
      }

      if (sets.otherFids.has(parentFid)) {
        continue
      }

      if (sets.anonFids.has(fid) && fid !== sets.anonworldFid) {
        continue
      }

      const hashValue = bytesToHexString(castAdd.parentCastId.hash)
      if (hashValue.isErr()) {
        continue
      }

      const messageHashValue = bytesToHexString(message.hash)
      if (messageHashValue.isErr()) {
        continue
      }

      console.log(`[reply] ${messageData.fid} replied ${hashValue.value}`)
      try {
        await db.posts.replyFromFarcaster(
          hashValue.value,
          messageData.fid,
          messageHashValue.value
        )
      } catch (e) {
        console.error(e)
      }
    } else if (messageData.castRemoveBody) {
      const castRemove = messageData.castRemoveBody
      if (!castRemove.targetHash) {
        continue
      }

      const hashValue = bytesToHexString(castRemove.targetHash)
      if (hashValue.isErr()) {
        continue
      }

      try {
        const result = await db.posts.unreplyFromFarcaster(hashValue.value)
        if (result.length > 0) {
          console.log(`[unreply] ${messageData.fid} unreplied ${hashValue.value}`)
        }
      } catch (e) {
        console.error(e)
      }
    } else if (messageData.reactionBody) {
      const reaction = messageData.reactionBody
      if (!reaction.targetCastId || reaction.type !== ReactionType.LIKE) {
        continue
      }

      const fid = reaction.targetCastId.fid
      if (fid > sets.maxFid) {
        sets = await getFidSets()
      }

      if (sets.otherFids.has(fid)) {
        continue
      }

      const hashValue = bytesToHexString(reaction.targetCastId.hash)
      if (hashValue.isErr()) {
        continue
      }

      if (messageData.type === MessageType.REACTION_ADD) {
        console.log(`[like] ${messageData.fid} liked ${hashValue.value}`)
        try {
          await db.posts.likeFromFarcaster(messageData.fid, hashValue.value)
        } catch (e) {
          if (e instanceof DrizzleError) {
            // TODO: Backfill first post of communities before 1/13/2025
            if (!e.message.includes('violates foreign key constraint')) {
              console.error(e)
            }
          }
        }
      } else if (messageData.type === MessageType.REACTION_REMOVE) {
        console.log(`[unlike] ${messageData.fid} unliked ${hashValue.value}`)
        try {
          await db.posts.unlikeFromFarcaster(messageData.fid, hashValue.value)
        } catch (e) {
          console.error(e)
        }
      }
    }

    i++
    if (i > 1000) {
      i = 0
      await redis.setLastEventId(event.id.toString())
    }
  }
}

main()
  .catch(console.error)
  .finally(() => {
    process.exit(0)
  })
