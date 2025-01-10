import { useSDK } from '../providers/sdk'
import { useQuery } from '@tanstack/react-query'

export function useSwapQuote(args: {
  chainId: number
  taker?: string
  buyToken: string
  sellToken: string
  sellAmount?: string
}) {
  const { sdk } = useSDK()
  return useQuery({
    queryKey: ['swap-quote', args],
    queryFn: async () => {
      if (!args.taker || !args.sellAmount) return null
      const data = await sdk.getSwapQuote({
        chainId: args.chainId,
        taker: args.taker,
        buyToken: args.buyToken,
        sellToken: args.sellToken,
        sellAmount: args.sellAmount,
      })
      return data?.data ?? null
    },
    enabled: !!args.sellAmount && !!args.taker,
  })
}
