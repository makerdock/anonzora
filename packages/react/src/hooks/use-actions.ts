import { useSDK } from '../providers/sdk'
import { useQuery } from '@tanstack/react-query'

export function useActions({ showHidden = false }: { showHidden?: boolean } = {}) {
  const { sdk } = useSDK()
  return useQuery({
    queryKey: ['actions', showHidden],
    queryFn: async () => {
      const data = await sdk.getActions(showHidden)
      return data?.data?.data ?? []
    },
  })
}
