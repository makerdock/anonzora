import { useQuery } from '@tanstack/react-query'
import { useSDK } from '../providers'

export function useCredential({ hash }: { hash: string }) {
  const { sdk } = useSDK()
  return useQuery({
    queryKey: ['credential', hash],
    queryFn: async () => {
      const credential = await sdk.getCredential(hash)
      return credential?.data ?? null
    },
  })
}
