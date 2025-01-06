import { desc, eq, isNull } from 'drizzle-orm'
import { db } from '../src/db'
import { credentialRepliesTable, postsTable } from '../src/db/schema'
import { DBCredential, DBPost, DBToken } from '../src/db/types'
import { CredentialType } from '@anonworld/common'

const POST_ACCOUNT_FID = 937160

function formatCredentialReply(credential: DBCredential, token?: DBToken) {
  switch (credential.type) {
    case CredentialType.ERC20_BALANCE:
      return 'Erc20'
    case CredentialType.ERC721_BALANCE:
      return 'Erc721'
  }
}

async function processBatch(posts: DBPost[]) {
  const credentials = await db.posts.getCredentials(posts.map(({ hash }) => hash))

  const tokenIds = new Set<string>()
  for (const credential of Object.values(credentials).flat()) {
    tokenIds.add(`${credential.metadata.chainId}:${credential.metadata.tokenAddress}`)
  }
  const tokens = await db.tokens.getBulk(Array.from(tokenIds))

  for (const post of posts) {
    console.log(`[post-creds] replying to post ${post.hash}`)

    const postCredentials = credentials[post.hash]
    if (!postCredentials || postCredentials.length === 0) {
      console.log('No credentials.')
      continue
    }

    for (const credential of postCredentials) {
      const relatedToken =
        tokens[`${credential.metadata.chainId}:${credential.metadata.tokenAddress}`]
      const formattedCredential = formatCredentialReply(credential, relatedToken)
      console.log(formattedCredential)
    }
  }
}

async function main() {
  const account = await db.socials.getFarcasterAccount(POST_ACCOUNT_FID)
  if (!account) {
    console.error(`Account ${POST_ACCOUNT_FID} not found`)
    return
  }

  while (true) {
    const result = await db.db
      .select()
      .from(postsTable)
      .leftJoin(
        credentialRepliesTable,
        eq(postsTable.hash, credentialRepliesTable.post_id)
      )
      .where(isNull(credentialRepliesTable.post_id))
      .orderBy(desc(postsTable.created_at))
    console.log(`[post-creds] found ${result.length} posts missing credentials`)

    for (let i = 0; i < result.length; i += 100) {
      const posts = result.slice(i, i + 100)
      await processBatch(posts.map((p) => p.posts) as DBPost[])
    }

    // Wait 30 seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 30_000))
  }
}

main()
  .catch(console.error)
  .finally(() => {
    process.exit(0)
  })
