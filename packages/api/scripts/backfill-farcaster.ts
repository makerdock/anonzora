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

  console.log(`[backfill-replies] ${posts.length} posts`)

  const toInsert = []

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
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

    for (const message of messages) {
      const hashValue = bytesToHexString(message.hash)
      if (hashValue.isErr() || !message.data?.fid) {
        continue
      }

      toInsert.push({
        post_hash: post.hash,
        fid: message.data.fid,
        reply_hash: hashValue.value,
      })
    }

    if (i % 1000 === 0) {
      console.log(`[backfill-replies] ${i} / ${posts.length}`)
    }
  }

  for (let i = 0; i < toInsert.length; i += 1000) {
    console.log(`[backfill-replies] inserting ${i} / ${toInsert.length}`)
    await db.db
      .insert(postRepliesTable)
      .values(toInsert.slice(i, i + 1000))
      .onConflictDoNothing()
  }
}

const backfillLikes = async () => {
  const posts = await db.db.select().from(postsTable)

  console.log(`[backfill-likes] ${posts.length} posts`)

  const toInsert = []

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
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

    for (const message of likes) {
      if (!message.data?.fid) {
        continue
      }

      toInsert.push({
        post_hash: post.hash,
        fid: message.data.fid,
      })
    }

    if (i % 1000 === 0) {
      console.log(`[backfill-likes] ${i} / ${posts.length}`)
    }
  }

  for (let i = 0; i < toInsert.length; i += 1000) {
    console.log(`[backfill-likes] inserting ${i} / ${toInsert.length}`)
    await db.db
      .insert(postLikesTable)
      .values(toInsert.slice(i, i + 1000))
      .onConflictDoNothing()
  }
}

async function deleteIrrelevantReplies() {
  const accounts = await db.socials.listFarcasterAccounts()
  const fids = accounts.map((account) => account.fid).filter((fid) => fid !== 899289)
  await db.db.delete(postRepliesTable).where(inArray(postRepliesTable.fid, fids))
}

export async function backfill() {
  await backfillReplies()
  await deleteIrrelevantReplies()
  await backfillLikes()
}
