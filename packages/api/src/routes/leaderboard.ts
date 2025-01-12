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
import { keccak256 } from 'viem'

export const leaderboardRoutes = createElysia({ prefix: '/leaderboard' }).get(
  '/',
  async ({ query }) => {
    const cached = await redis.getLeaderboard()
    if (cached) {
      return {
        data: JSON.parse(cached).slice(0, 100),
      }
    }
    return { data: [] }
  }
)

export async function updateLeaderboard() {
  const result = await db.db
    .select()
    .from(postCredentialsTable)
    .innerJoin(
      postLikesTable,
      eq(postCredentialsTable.post_hash, postLikesTable.post_hash)
    )

  const fidLikes: Record<string, number[]> = {}
  const passkeyLikes: Record<string, string[]> = {}

  for (const row of result) {
    const credentialId = row.post_credentials.credential_id
    if (row.post_likes.fid) {
      if (!fidLikes[credentialId]) {
        fidLikes[credentialId] = []
      }
      fidLikes[credentialId].push(row.post_likes.fid)
    }
    if (row.post_likes.passkey_id) {
      if (!passkeyLikes[credentialId]) {
        passkeyLikes[credentialId] = []
      }
      passkeyLikes[credentialId].push(row.post_likes.passkey_id)
    }
  }

  const uniqueFids = new Set(Object.values(fidLikes).flat())
  const farcasterUsers = await getFarcasterUsers(Array.from(uniqueFids))
  const maxFollowers = Math.max(...farcasterUsers.map((user) => user.follower_count))

  const scores: Record<string, number> = {}

  for (const [credentialId, fids] of Object.entries(fidLikes)) {
    if (!scores[credentialId]) {
      scores[credentialId] = 0
    }
    for (const fid of fids) {
      const user = farcasterUsers.find((user) => user.fid === fid)
      if (user) {
        scores[credentialId] += Math.floor((user.follower_count / maxFollowers) * 100)
      }
    }
  }

  for (const [credentialId, passkeyIds] of Object.entries(passkeyLikes)) {
    if (!scores[credentialId]) {
      scores[credentialId] = 0
    }
    scores[credentialId] += 25 * passkeyIds.length
  }

  const topThousand = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, score]) => score > 0)
    .slice(0, 1000)

  const credentials = await db.db
    .select()
    .from(credentialsTable)
    .leftJoin(vaultsTable, eq(credentialsTable.vault_id, vaultsTable.id))
    .where(
      inArray(
        credentialsTable.id,
        topThousand.map(([id]) => id)
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
          topThousand.map(([id]) => id)
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

  const data = topThousand.map(([id, score]) => ({
    score,
    credential: {
      ...credentialsById[id],
      token:
        'chainId' in credentialsById[id].metadata
          ? tokens[
              `${credentialsById[id].metadata.chainId}:${credentialsById[id].metadata.tokenAddress}`
            ]
          : undefined,
      vault: credentialsById[id].vault
        ? {
            ...credentialsById[id].vault,
            credentials: [],
            created_at: credentialsById[id].created_at.toISOString(),
          }
        : undefined,
      id: undefined,
      proof: undefined,
      parent_id: undefined,
      reverified_id: undefined,
    },
    posts: postCountsById[id],
  }))

  await redis.setLeaderboard(JSON.stringify(data))

  return data
}

const getFarcasterUsers = async (fids: number[]) => {
  const batchSize = 100
  const users: FarcasterUser[] = []

  for (let i = 0; i < fids.length; i += batchSize) {
    const batch = fids.slice(i, i + batchSize)
    const response = await neynar.getBulkUsersByFids(batch)
    users.push(...response.users)
  }

  return users
}
