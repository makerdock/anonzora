import { drizzle } from 'drizzle-orm/node-postgres'
import {
  credentialsTable,
  postCredentialsTable,
  postLikesTable,
  postRelationshipsTable,
  postRepliesTable,
  postsTable,
  vaultsTable,
} from '../schema'
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { DBCredential, DBPost, DBPostLike, DBPostRelationship, DBVault } from '../types'
import { alias } from 'drizzle-orm/pg-core'
import { RevealArgs } from '@anonworld/common'

export class PostsRepository {
  private db: ReturnType<typeof drizzle>

  constructor(db: ReturnType<typeof drizzle>) {
    this.db = db
  }

  async create(params: typeof postsTable.$inferInsert) {
    const [post] = await this.db
      .insert(postsTable)
      .values(params)
      .onConflictDoUpdate({ target: [postsTable.hash], set: { deleted_at: null } })
      .returning()

    return post as DBPost
  }

  async delete(hash: string) {
    await this.db
      .update(postsTable)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(eq(postsTable.hash, hash))
  }

  async get(hash: string) {
    const [post] = await this.db
      .select()
      .from(postsTable)
      .where(and(eq(postsTable.hash, hash), isNull(postsTable.deleted_at)))
      .limit(1)
    return post as DBPost | null
  }

  async getBulk(hashes: string[]) {
    const posts = await this.db
      .select()
      .from(postsTable)
      .where(and(inArray(postsTable.hash, hashes), isNull(postsTable.deleted_at)))

    return posts as DBPost[]
  }

  async reveal(args: RevealArgs) {
    await this.db
      .update(postsTable)
      .set({
        reveal_metadata: {
          message: args.message,
          phrase: args.phrase,
          signature: args.signature,
          address: args.address,
        },
        updated_at: new Date(),
      })
      .where(eq(postsTable.reveal_hash, args.hash))
  }

  async getFeed(fid: number, opts: { limit: number; offset: number }) {
    const parentPosts = alias(postsTable, 'parent_posts')
    const posts = await this.db
      .select()
      .from(postsTable)
      .leftJoin(
        postRelationshipsTable,
        eq(postsTable.hash, postRelationshipsTable.target_id)
      )
      .leftJoin(parentPosts, eq(parentPosts.hash, postRelationshipsTable.post_hash))
      .where(
        and(
          isNull(postsTable.deleted_at),
          eq(postsTable.fid, fid),
          sql`${postsTable.data}->>'reply' IS NULL`
        )
      )
      .orderBy(desc(postsTable.created_at))
      .limit(opts.limit)
      .offset(opts.offset)

    return posts as {
      posts: DBPost
      parent_posts: DBPost | null
      post_relationships: DBPostRelationship | null
    }[]
  }

  async getFeedForHashes(hashes: string[]) {
    const parentPosts = alias(postsTable, 'parent_posts')
    const posts = await this.db
      .select()
      .from(postsTable)
      .leftJoin(
        postRelationshipsTable,
        eq(postsTable.hash, postRelationshipsTable.target_id)
      )
      .leftJoin(parentPosts, eq(parentPosts.hash, postRelationshipsTable.post_hash))
      .where(
        and(
          isNull(postsTable.deleted_at),
          inArray(postsTable.hash, hashes),
          sql`${postsTable.data}->>'reply' IS NULL`
        )
      )
      .orderBy(desc(postsTable.created_at))

    return posts as {
      posts: DBPost
      parent_posts: DBPost | null
      post_relationships: DBPostRelationship | null
    }[]
  }

  async countForFid(fid: number) {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(postsTable)
      .where(eq(postsTable.fid, fid))
    return result.count
  }

  async replyFromFarcaster(hash: string, replyFid: number, replyHash: string) {
    await this.db
      .insert(postRepliesTable)
      .values({ post_hash: hash, fid: replyFid, reply_hash: replyHash })
      .onConflictDoNothing()
  }

  async unreplyFromFarcaster(replyHash: string) {
    return await this.db
      .delete(postRepliesTable)
      .where(eq(postRepliesTable.reply_hash, replyHash))
      .returning()
  }

  async likeFromFarcaster(fid: number, hash: string) {
    await this.db
      .insert(postLikesTable)
      .values({ fid, post_hash: hash })
      .onConflictDoNothing()
  }

  async unlikeFromFarcaster(fid: number, hash: string) {
    await this.db
      .delete(postLikesTable)
      .where(and(eq(postLikesTable.fid, fid), eq(postLikesTable.post_hash, hash)))
  }

  async like(passkeyId: string, hash: string) {
    await this.db
      .insert(postLikesTable)
      .values({ passkey_id: passkeyId, post_hash: hash })
      .onConflictDoNothing()
  }

  async unlike(passkeyId: string, hash: string) {
    await this.db
      .delete(postLikesTable)
      .where(
        and(eq(postLikesTable.passkey_id, passkeyId), eq(postLikesTable.post_hash, hash))
      )
  }

  async getLikes(passkeyId: string, hashes: string[]) {
    const response = await this.db
      .select()
      .from(postLikesTable)
      .where(
        and(
          eq(postLikesTable.passkey_id, passkeyId),
          inArray(postLikesTable.post_hash, hashes)
        )
      )

    return response as DBPostLike[]
  }

  async countLikes(hashes: string[]) {
    const counts = await this.db
      .select({ post_hash: postLikesTable.post_hash, count: sql<number>`count(*)` })
      .from(postLikesTable)
      .where(inArray(postLikesTable.post_hash, hashes))
      .groupBy(postLikesTable.post_hash)
    return counts.reduce(
      (acc, count) => {
        acc[count.post_hash] = Number(count.count)
        return acc
      },
      {} as Record<string, number>
    )
  }

  async countReplies(hashes: string[]) {
    const counts = await this.db
      .select({ post_hash: postRepliesTable.post_hash, count: sql<number>`count(*)` })
      .from(postRepliesTable)
      .where(inArray(postRepliesTable.post_hash, hashes))
      .groupBy(postRepliesTable.post_hash)
    return counts.reduce(
      (acc, count) => {
        acc[count.post_hash] = Number(count.count)
        return acc
      },
      {} as Record<string, number>
    )
  }

  async getCredentials(hashes: string[]) {
    const credentials = await this.db
      .select()
      .from(postCredentialsTable)
      .innerJoin(
        credentialsTable,
        eq(postCredentialsTable.credential_id, credentialsTable.id)
      )
      .leftJoin(vaultsTable, eq(credentialsTable.vault_id, vaultsTable.id))
      .where(inArray(postCredentialsTable.post_hash, hashes))

    const credentialsByHash = credentials.reduce(
      (acc, c) => {
        if (!acc[c.post_credentials.post_hash]) {
          acc[c.post_credentials.post_hash] = []
        }
        acc[c.post_credentials.post_hash].push({
          ...c.credential_instances,
          vault: c.vaults,
        } as DBCredential & { vault: DBVault | null })
        return acc
      },
      {} as Record<string, (DBCredential & { vault: DBVault | null })[]>
    )

    return credentialsByHash
  }

  async addCredentials(hash: string, credentialIds: string[]) {
    await this.db.insert(postCredentialsTable).values(
      credentialIds.map((credentialId) => ({
        post_hash: hash,
        credential_id: credentialId,
      }))
    )
  }
}
