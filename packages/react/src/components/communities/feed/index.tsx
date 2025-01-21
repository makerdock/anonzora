import { Spinner, YStack } from '@anonworld/ui'
import { CommunityDisplay } from './display'
import { useCommunities } from '../../../hooks/use-communities'
import { Link } from 'solito/link'
import { COMMUNITY_REWARD_THRESHOLD } from '../utils'
import { getBalances } from '../utils'

export function CommunityFeed({ sort }: { sort: string }) {
  const { data: communities, isLoading } = useCommunities()

  if (isLoading) {
    return <Spinner color="$color12" />
  }

  const sortedCommunities = communities?.sort((a, b) => {
    if (sort === 'popular' || sort === 'rewards') {
      return b.followers - a.followers
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const filteredCommunities = sortedCommunities?.filter((community) => {
    if (sort === 'rewards') {
      const { hasRewards } = getBalances(community)
      return hasRewards
    }
    return true
  })

  return (
    <YStack gap="$4" $xs={{ gap: '$0', bbw: '$0.5', bc: '$borderColor' }}>
      {filteredCommunities?.map((community) => (
        <Link key={community.id} href={`/communities/${community.id}`}>
          <CommunityDisplay community={community} hoverable />
        </Link>
      ))}
    </YStack>
  )
}
