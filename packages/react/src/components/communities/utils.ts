import { Community } from '@anonworld/common'
import { formatUnits } from 'viem'

const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'

export const COMMUNITY_REWARD_THRESHOLD = 0.1

export const getBalances = (community?: Community) => {
  if (!community?.wallet_metadata?.fees) return { weth: 0, token: 0 }
  const { collected, uncollected } = community.wallet_metadata.fees
  const collectedWeth = collected[WETH_ADDRESS] ?? 0
  const uncollectedWeth = uncollected[WETH_ADDRESS] ?? 0
  const collectedToken = collected[community.token.address] ?? 0
  const uncollectedToken = uncollected[community.token.address] ?? 0

  const wethBalance = BigInt(collectedWeth) + BigInt(uncollectedWeth)
  const tokenBalance = BigInt(collectedToken) + BigInt(uncollectedToken)

  const formattedWethBalance = formatUnits(wethBalance, 18)
  const formattedTokenBalance = formatUnits(tokenBalance, community.token.decimals)

  const roundedWeth = Math.floor(Number(formattedWethBalance) * 10) / 10
  const roundedToken = Math.floor(Number(formattedTokenBalance) * 10) / 10

  return {
    weth: Number(formattedWethBalance),
    roundedWeth,
    token: Number(formattedTokenBalance),
    roundedToken,
    hasRewards: roundedWeth >= COMMUNITY_REWARD_THRESHOLD,
    recipients: Math.floor(roundedWeth / COMMUNITY_REWARD_THRESHOLD),
  }
}
