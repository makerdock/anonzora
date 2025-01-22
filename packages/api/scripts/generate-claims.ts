import { CredentialWithId } from '@anonworld/common'
import { db } from '../src/db'
import { redis } from '../src/services/redis'

const DISTRIBUTOR_ADDRESS = '0x8117efF53BA83D42408570c69C6da85a2Bb6CA05'

async function main() {
  const communities = await db.communities.list()
  for (const community of communities) {
    if (!community.wallet_metadata) continue

    const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'
    const uncollectedWeth =
      Number(
        (BigInt(community.wallet_metadata.fees.uncollected[WETH_ADDRESS]) *
          BigInt(1000)) /
          BigInt(10 ** 18)
      ) / 1000

    const collectedWeth =
      Number(
        (BigInt(community.wallet_metadata.fees.collected[WETH_ADDRESS]) * BigInt(1000)) /
          BigInt(10 ** 18)
      ) / 1000

    const rewards = Math.floor(collectedWeth * 10) / 10
    const diff = collectedWeth - rewards

    if (diff + uncollectedWeth >= 0.1) {
      throw new Error(`Collect rewards for ${community.id}`)
    }

    if (rewards < 0.1) continue

    const cachedLeaderboard = await redis.getLeaderboard(`last-week:${community.id}`)
    if (!cachedLeaderboard) {
      throw new Error(`No leaderboard found for ${community.id}`)
    }

    const leaderboard: {
      score: number
      credential: CredentialWithId
      posts: number
      likes: number
      replies: number
    }[] = JSON.parse(cachedLeaderboard)

    const recipients = Math.round(rewards / 0.1)
    for (let i = 0; i < recipients; i++) {
      const recipient = leaderboard[i]
      const credential = await db.credentials.getByHash(recipient.credential.hash)
      if (!credential) {
        throw new Error(`Credential not found for ${recipient.credential.hash}`)
      }
      console.log(
        `[${community.name}] [${i + 1}/${recipients}] ${credential.parent_id} ${recipient.score}`
      )
    }
  }
}

main()
  .catch(console.error)
  .finally(() => {
    process.exit(0)
  })
