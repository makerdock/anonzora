import { useSDK } from '../providers/sdk'
import { useQuery } from '@tanstack/react-query'

export function useCommunityActions(communityId: string) {
  const { sdk } = useSDK()
  return useQuery({
    queryKey: ['actions', communityId],
    queryFn: async () => {
      const data = await sdk.getCommunityActions(communityId)
      return data?.data?.data ?? []
    },
  })
}
