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
import { neynar } from '../src/services/neynar'

const client = getSSLHubRpcClient('hub-grpc-api.neynar.com', {
  interceptors: [
    createDefaultMetadataKeyInterceptor('x-api-key', process.env.NEYNAR_API_KEY!),
  ],
})

const getFidSets = async () => {
  const accounts = await db.socials.listFarcasterAccounts()
  const { fid: maxFid } = await neynar.getNewFid()
  const relevantFids = new Set(accounts.map((account) => account.fid))

  const irrelevantFids = new Set(
    Array.from({ length: maxFid }, (_, i) => i + 1).filter(
      (fid) => !relevantFids.has(fid)
    )
  )

  return { relevantFids, irrelevantFids, maxFid }
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

  for await (const value of subscription.value) {
    const event = value as HubEvent
    if (event.type !== HubEventType.MERGE_MESSAGE) {
      continue
    }

    const messageData = event.mergeMessageBody?.message?.data
    if (!messageData || !messageData.reactionBody) {
      continue
    }

    const reaction = messageData.reactionBody
    if (!reaction.targetCastId || reaction.type !== ReactionType.LIKE) {
      continue
    }

    const fid = reaction.targetCastId.fid
    if (fid > sets.maxFid) {
      sets = await getFidSets()
    }

    if (sets.irrelevantFids.has(fid)) {
      continue
    }

    const hashValue = bytesToHexString(reaction.targetCastId.hash)
    if (hashValue.isErr()) {
      continue
    }

    if (messageData.type === MessageType.REACTION_ADD) {
      console.log(`[like] ${messageData.fid} liked ${hashValue.value}`)
      await db.posts.likeFromFarcaster(messageData.fid, hashValue.value)
    } else if (messageData.type === MessageType.REACTION_REMOVE) {
      console.log(`[unlike] ${messageData.fid} unliked ${hashValue.value}`)
      await db.posts.unlikeFromFarcaster(messageData.fid, hashValue.value)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => {
    process.exit(0)
  })
