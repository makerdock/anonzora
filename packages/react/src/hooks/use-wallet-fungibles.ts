import { useQuery } from '@tanstack/react-query'
import { useSDK } from '../providers'
import { useAccount } from 'wagmi'

export function useWalletFungibles() {
  const { sdk } = useSDK()
  const { address } = useAccount()
  return useQuery({
    queryKey: ['wallet-fungibles', address],
    queryFn: async () => {
      if (!address) return []
      try {
        const data = await sdk.getWalletFungibles(address)
        return data.data?.data ?? []
      } catch (error) {
        console.warn('Failed to fetch wallet fungibles:', error)
        return [] // Return empty array on error to not block UI
      }
    },
    enabled: !!address,
    retry: false, // Don't retry on failure
  })
}
