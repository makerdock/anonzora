import { useSDK } from '../providers/sdk'
import { useQuery } from '@tanstack/react-query'

export function useLeaderboard(
  timeframe: 'all-time' | 'week' | 'last-week',
  community?: string
) {
  const { sdk } = useSDK()
  return useQuery({
    queryKey: ['leaderboard', timeframe, community],
    queryFn: async () => {
      const data = await sdk.getLeaderboard(timeframe, community)
      return data?.data?.data ?? []
    },
  })
}
