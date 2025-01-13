import { db } from '../src/db'
import { neynar } from '../src/services/neynar'

async function main() {
  const communities = await db.communities.list()
  for (const community of communities) {
    const farcaster = await db.socials.getFarcasterAccount(community.fid)
    const url = `https://anon.world/communities/${farcaster.metadata.username}`
    console.log(`[sync] ${community.id} ${farcaster.metadata.username}`)
    await neynar.updateUserProfile({
      fid: community.fid,
      name: community.name,
      description: `${community.description} | ${url}`,
      imageUrl: community.image_url,
      url,
    })
  }
}

main()
  .catch(console.error)
  .finally(() => {
    process.exit(0)
  })
