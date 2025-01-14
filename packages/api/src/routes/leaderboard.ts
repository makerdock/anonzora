import { and, count, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '../db'
import {
  credentialsTable,
  postCredentialsTable,
  postLikesTable,
  postsTable,
  vaultsTable,
} from '../db/schema'
import { redis } from '../services/redis'
import { createElysia } from '../utils'
import { neynar } from '../services/neynar'
import { FarcasterUser } from '@anonworld/common'
import { DBCredential } from '../db/types'
import { DBVault } from '../db/types'

export const leaderboardRoutes = createElysia({ prefix: '/leaderboard' }).get(
  '/',
  async ({ query }) => {
    const cached = await redis.getLeaderboard()
    if (cached) {
      return {
        data: JSON.parse(cached).slice(0, 100),
      }
    }
    const data = await updateLeaderboard()
    return { data }
  }
)

async function getLikesByCredentialId() {
  const result = await db.db
    .select()
    .from(postCredentialsTable)
    .innerJoin(
      postLikesTable,
      eq(postCredentialsTable.post_hash, postLikesTable.post_hash)
    )

  const likes: Record<string, { passkey: string[]; fid: number[] }> = {}
  for (const row of result) {
    const credentialId = row.post_credentials.credential_id
    if (row.post_likes.fid) {
      if (!likes[credentialId]) {
        likes[credentialId] = { fid: [], passkey: [] }
      }
      likes[credentialId].fid.push(row.post_likes.fid)
    }
    if (row.post_likes.passkey_id) {
      if (!likes[credentialId]) {
        likes[credentialId] = { fid: [], passkey: [] }
      }
      likes[credentialId].passkey.push(row.post_likes.passkey_id)
    }
  }

  return likes
}

async function getFarcasterUsers(fids: number[]) {
  const batchSize = 100
  const users: FarcasterUser[] = []

  for (let i = 0; i < fids.length; i += batchSize) {
    const batch = fids.slice(i, i + batchSize)
    const response = await neynar.getBulkUsersByFids(batch)
    users.push(...response.users)
  }

  return users.reduce(
    (acc, user) => {
      acc[user.fid] = user
      return acc
    },
    {} as Record<number, FarcasterUser>
  )
}

async function getScores(likes: Record<string, { fid: number[]; passkey: string[] }>) {
  const farcasterUsers = await getFarcasterUsers(
    Array.from(new Set(Object.values(likes).flatMap((like) => like.fid)))
  )
  const maxFollowerCount = Math.max(
    ...Object.values(farcasterUsers).map((user) => user.follower_count)
  )

  const scores: Record<
    string,
    {
      credentialId: string
      score: number
      likes: number
    }
  > = {}

  for (const [credentialId, credentialLikes] of Object.entries(likes)) {
    if (!scores[credentialId]) {
      scores[credentialId] = {
        credentialId,
        score: 0,
        likes: credentialLikes.fid.length + credentialLikes.passkey.length,
      }
    }

    for (const fid of credentialLikes.fid) {
      const user = farcasterUsers[fid]
      if (user) {
        scores[credentialId].score += Math.floor(
          (user.follower_count / maxFollowerCount) * 100
        )
      }
    }

    scores[credentialId].likes += 25 * credentialLikes.passkey.length
  }

  return Object.values(scores)
    .sort((a, b) => b.score - a.score)
    .filter((score) => score.score > 0)
}

export async function updateLeaderboard() {
  const likes = await getLikesByCredentialId()
  const scores = await getScores(likes)

  const topThousand = scores.slice(0, 1000)

  const credentials = await db.db
    .select()
    .from(credentialsTable)
    .leftJoin(vaultsTable, eq(credentialsTable.vault_id, vaultsTable.id))
    .where(
      inArray(
        credentialsTable.id,
        topThousand.map((score) => score.credentialId)
      )
    )

  const postCounts = await db.db
    .select({
      credential_id: postCredentialsTable.credential_id,
      count: count(),
    })
    .from(postCredentialsTable)
    .innerJoin(postsTable, eq(postCredentialsTable.post_hash, postsTable.hash))
    .innerJoin(
      credentialsTable,
      eq(postCredentialsTable.credential_id, credentialsTable.id)
    )
    .where(
      and(
        inArray(
          credentialsTable.parent_id,
          topThousand.map((score) => score.credentialId)
        ),
        isNull(postsTable.deleted_at),
        eq(postsTable.fid, 899289)
      )
    )
    .groupBy(postCredentialsTable.credential_id)

  const postCountsById = postCounts.reduce(
    (acc, postCount) => {
      acc[postCount.credential_id] = postCount.count
      return acc
    },
    {} as Record<string, number>
  )

  const credentialsById = credentials.reduce(
    (acc, credential) => {
      acc[credential.credential_instances.id] = {
        ...credential.credential_instances,
        vault: credential.vaults,
      } as DBCredential & { vault: DBVault | null }
      return acc
    },
    {} as Record<string, DBCredential & { vault: DBVault | null }>
  )

  const tokenIds = new Set<string>()
  for (const credential of Object.values(credentialsById)) {
    if ('chainId' in credential.metadata) {
      tokenIds.add(`${credential.metadata.chainId}:${credential.metadata.tokenAddress}`)
    }
  }

  const tokens = await db.tokens.getBulk(Array.from(tokenIds))

  const data = topThousand.map((score) => {
    const credential = credentialsById[score.credentialId]

    let tokenId: string | undefined
    if ('chainId' in credential.metadata) {
      tokenId = `${credential.metadata.chainId}:${credential.metadata.tokenAddress}`
    }

    return {
      score: score.score,
      posts: postCountsById[score.credentialId] ?? 0,
      likes: score.likes,
      credential: {
        ...credential,
        token: tokenId ? tokens[tokenId] : undefined,
        vault: credential.vault
          ? {
              ...credential.vault,
              passkey_id: undefined,
              credentials: [],
              created_at: credential.created_at.toISOString(),
            }
          : undefined,
        id: undefined,
        proof: undefined,
        parent_id: undefined,
        reverified_id: undefined,
      },
    }
  })

  await redis.setLeaderboard(JSON.stringify(data))

  return data
}
