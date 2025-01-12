import { useSDK } from '../providers/sdk'
import { useQuery } from '@tanstack/react-query'

export function useLeaderboard() {
  const { sdk } = useSDK()
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const data = await sdk.getLeaderboard()
      return data?.data?.data ?? []
    },
  })
}
