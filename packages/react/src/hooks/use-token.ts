import { useQuery } from '@tanstack/react-query'
import { useSDK } from '../providers'

export function useToken(args?: {
  chainId: number
  address: string
}) {
  const { sdk } = useSDK()
  return useQuery({
    queryKey: ['token', args?.chainId, args?.address],
    queryFn: async () => {
      if (!args) return null
      const response = await sdk.getToken(args.chainId, args.address)
      return response.data ?? null
    },
    enabled: !!args,
  })
}
