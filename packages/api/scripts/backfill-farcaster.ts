import {
  bytesToHexString,
  createDefaultMetadataKeyInterceptor,
  getSSLHubRpcClient,
  hexStringToBytes,
  ReactionType,
} from '@farcaster/hub-nodejs'
import { db } from '../src/db'
import { postLikesTable, postRepliesTable, postsTable } from '../src/db/schema'
import { eq, inArray } from 'drizzle-orm'

const client = getSSLHubRpcClient('hub-grpc-api.neynar.com', {
  interceptors: [
    createDefaultMetadataKeyInterceptor('x-api-key', process.env.NEYNAR_API_KEY!),
  ],
})

const backfillReplies = async () => {
  const posts = await db.db.select().from(postsTable)

  for (const post of posts) {
    const bytesValue = hexStringToBytes(post.hash)
    if (bytesValue.isErr()) {
      continue
    }

    const messagesValue = await client.getCastsByParent({
      parentCastId: {
        fid: post.fid,
        hash: bytesValue.value,
      },
    })

    if (messagesValue.isErr()) {
      continue
    }

    const { messages } = messagesValue.value

    console.log(`[${post.hash}] has ${messages.length} replies`)

    await db.db.delete(postRepliesTable).where(eq(postRepliesTable.post_hash, post.hash))

    for (const message of messages) {
      const hashValue = bytesToHexString(message.hash)
      if (hashValue.isErr() || !message.data?.fid) {
        continue
      }

      await db.db
        .insert(postRepliesTable)
        .values({
          post_hash: post.hash,
          fid: message.data.fid,
          reply_hash: hashValue.value,
        })
        .onConflictDoNothing()
    }
  }
}

const backfillLikes = async () => {
  const posts = await db.db.select().from(postsTable)

  for (const post of posts) {
    const bytesValue = hexStringToBytes(post.hash)
    if (bytesValue.isErr()) {
      continue
    }

    const messagesValue = await client.getReactionsByTarget({
      targetCastId: {
        fid: post.fid,
        hash: bytesValue.value,
      },
    })

    if (messagesValue.isErr()) {
      continue
    }

    const { messages } = messagesValue.value

    const likes = messages.filter(
      (message) => message.data?.reactionBody?.type === ReactionType.LIKE
    )

    console.log(`[${post.hash}] has ${likes.length} likes`)

    for (const message of likes) {
      if (!message.data?.fid) {
        continue
      }

      await db.db
        .insert(postLikesTable)
        .values({
          post_hash: post.hash,
          fid: message.data.fid,
        })
        .onConflictDoNothing()
    }
  }
}

async function deleteIrrelevantReplies() {
  const accounts = await db.socials.listFarcasterAccounts()
  const fids = accounts.map((account) => account.fid).filter((fid) => fid !== 899289)
  await db.db.delete(postRepliesTable).where(inArray(postRepliesTable.fid, fids))
}

async function main() {
  await backfillLikes()
}

main()
  .catch(console.error)
  .then(() => {
    process.exit(0)
  })
