import { useInfiniteQuery } from '@tanstack/react-query'
import { useSDK } from '../providers/sdk'
import { Post } from '@anonworld/common'

const pageSize = 25

export function useCredentialPosts({
  hash,
}: {
  hash: string
}) {
  const { sdk } = useSDK()
  return useInfiniteQuery<Post[]>({
    queryKey: ['credential-posts', hash],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await sdk.getCredentialPosts(hash, pageParam as number)
      const posts = response?.data?.data || []
      return posts
    },
    getNextPageParam: (lastPage: Post[], allPages: Post[][]) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length + 1
    },
  })
}
