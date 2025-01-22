import { base, CredentialWithId } from '@anonworld/common'
import { db } from '../src/db'
import { redis } from '../src/services/redis'
import { PrivyClient } from '@privy-io/server-auth'
import { decodeFunctionData, encodeFunctionData, erc20Abi, parseUnits } from 'viem'
import { waitForTransactionReceipt } from 'viem/actions'
import { communitiesTable } from '../src/db/schema'
import { eq } from 'drizzle-orm'

const DISTRIBUTOR_ADDRESS = '0x8117efF53BA83D42408570c69C6da85a2Bb6CA05'

const privy = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!, {
  walletApi: {
    authorizationPrivateKey: process.env.PRIVY_AUTH_KEY,
  },
})

async function main() {
  const communities = await db.communities.list()
  for (const community of communities) {
    if (!community.wallet_metadata) continue

    const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'
    const collectedWeth =
      Number(
        (BigInt(community.wallet_metadata.fees.collected[WETH_ADDRESS]) * BigInt(1000)) /
          BigInt(10 ** 18)
      ) / 1000

    const rewards = Math.floor(collectedWeth * 10) / 10
    if (rewards < 0.1) continue

    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [DISTRIBUTOR_ADDRESS, BigInt(parseUnits(rewards.toString(), 18))],
    })

    const [communityWithWalletId] = await db.db
      .select()
      .from(communitiesTable)
      .where(eq(communitiesTable.id, community.id))
      .limit(1)

    if (!communityWithWalletId?.wallet_id) {
      console.error('no wallet id', community.id)
      continue
    }

    const tx = await privy.walletApi.ethereum.sendTransaction({
      walletId: communityWithWalletId.wallet_id,
      caip2: 'eip155:8453',
      transaction: {
        to: WETH_ADDRESS,
        value: 0,
        chainId: 8453,
        data,
      },
    })

    if ('hash' in tx) {
      console.log('sent tx', tx.hash)
      await waitForTransactionReceipt(base.client, { hash: tx.hash as `0x${string}` })
    } else {
      console.error('failed to send tx', tx)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => {
    process.exit(0)
  })
