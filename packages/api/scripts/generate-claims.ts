import { CredentialWithId } from '@anonworld/common'
import { db } from '../src/db'
import { redis } from '../src/services/redis'

const COMMUNITIES_WITH_REWARDS: Record<string, number> = {
  'd38d04da-59f6-4b6c-8dc9-7ac910514866': 11,
  '47624f32-6536-402a-b1b0-d2affb549d9b': 10,
  '96a8a286-7ef1-4b69-a0e1-298d0c41bda6': 1,
}

async function main() {
  const communities = await db.communities.list()

  const ids: string[] = []

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

    const shouldReward = !!COMMUNITIES_WITH_REWARDS[community.id]

    if (diff + uncollectedWeth >= 0.1 && !shouldReward) {
      throw new Error(`Collect rewards for ${community.id}`)
    }

    if (rewards < 0.1 && !shouldReward) continue

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

    for (let i = 0; i < COMMUNITIES_WITH_REWARDS[community.id]; i++) {
      const recipient = leaderboard[i]
      const credential = await db.credentials.getByHash(recipient.credential.hash)
      if (!credential) {
        throw new Error(`Credential not found for ${recipient.credential.hash}`)
      }
      ids.push(credential.parent_id)
    }
  }

  for (const id of ids.sort()) {
    console.log(id)
  }
}

main()
  .catch(console.error)
  .finally(() => {
    process.exit(0)
  })
