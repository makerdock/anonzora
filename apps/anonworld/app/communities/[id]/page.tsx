'use client'

import {
  CommunityDisplay,
  NewFeed,
  SwapTokens,
  NewCommunityPost,
  useCommunity,
} from '@anonworld/react'
import { View, XStack } from '@anonworld/ui'
import { Content } from '@/components/content'

export default function CommunityPage({ params }: { params: { id: string } }) {
  const { data: community } = useCommunity({ id: params.id })

  if (!community) {
    return null
  }

  return (
    <Content>
      <CommunityDisplay community={community} />
      <XStack ai="center" jc="space-between" $xs={{ px: '$2' }}>
        <View />
        <XStack gap="$2">
          <SwapTokens
            initialBuyToken={{
              chainId: community.token.chain_id,
              address: community.token.address,
            }}
          />
          <NewCommunityPost community={community} />
        </XStack>
      </XStack>
      <NewFeed fid={community.fid} />
    </Content>
  )
}
