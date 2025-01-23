import { db } from '../src/db'
import { readContract } from 'viem/actions'
import { erc20Abi } from 'viem'
import { base, Community } from '@anonworld/common'

const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'

async function getCollectedBalance(
  tokenAddress: `0x${string}`,
  walletAddress: `0x${string}`
) {
  const [tokenBalance, wethBalance] = await Promise.all([
    readContract(base.client, {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`],
    }),
    readContract(base.client, {
      address: WETH_ADDRESS,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`],
    }),
  ])

  return {
    [tokenAddress]: tokenBalance.toString(),
    [WETH_ADDRESS]: wethBalance.toString(),
  }
}

async function getUncollectedBalance(tokenAddress: `0x${string}`) {
  const response = await fetch(
    `https://www.clanker.world/api/get-estimated-uncollected-fees/${tokenAddress}`,
    {
      headers: {
        'x-api-key': process.env.CLANKER_API_KEY as string,
      },
    }
  )

  if (!response.ok) {
    return null
  }

  const data: {
    lockerAddress: string
    lpNftId: number
    token1UncollectedRewards: string
    token0UncollectedRewards: string
    token0: {
      chainId: number
      address: string
      symbol: string
      decimals: number
      name: string
    }
    token1: {
      chainId: number
      address: string
      symbol: string
      decimals: number
      name: string
    }
  } = await response.json()

  if (!data?.token0 || !data?.token1) {
    return null
  }

  const wethBalance =
    data.token0.address === WETH_ADDRESS
      ? data.token0UncollectedRewards
      : data.token1UncollectedRewards

  const tokenBalance =
    data.token0.address === WETH_ADDRESS
      ? data.token1UncollectedRewards
      : data.token0UncollectedRewards

  return {
    [tokenAddress]: Number(tokenBalance)
      .toLocaleString('fullwide', {
        useGrouping: false,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      .toString(),
    [WETH_ADDRESS]: Number(wethBalance)
      .toLocaleString('fullwide', {
        useGrouping: false,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      .toString(),
  }
}

export async function syncCommunityWallet(community: Community) {
  if (
    !community.token ||
    !community.wallet_address ||
    community.token.platform !== 'clanker'
  ) {
    return
  }

  const [collected, uncollected] = await Promise.all([
    getCollectedBalance(
      community.token.address as `0x${string}`,
      community.wallet_address as `0x${string}`
    ),
    getUncollectedBalance(community.token.address as `0x${string}`),
  ])

  if (!collected || !uncollected) {
    return
  }

  const fees = {
    collected,
    uncollected,
  }

  await db.communities.update(community.id, {
    wallet_metadata: { fees },
  })

  console.log(
    `[community] [${community.name}] collected fees: ${JSON.stringify(
      fees.collected
    )} uncollected fees: ${JSON.stringify(fees.uncollected)}`
  )
}
