import { useQuery } from '@tanstack/react-query'
import { useCredentials, useSDK } from '../providers'
import { useMemo } from 'react'

export function useClaims() {
  const { sdk } = useSDK()
  const { credentials } = useCredentials()

  const ids = useMemo(() => {
    return credentials.flatMap((c) => {
      const id = c.id
      if (c.parent_id) {
        return [id, c.parent_id]
      }
      return [id]
    })
  }, [credentials])

  return useQuery({
    queryKey: ['claims', ids],
    queryFn: async () => {
      const claims = await sdk.getClaims(ids)
      return claims?.data?.data ?? []
    },
    enabled: ids.length > 0,
  })
}
