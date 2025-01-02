'use client'

import {
  CommunityDisplay,
  NewCommunityPost,
  NewFeed,
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
        <NewCommunityPost community={community} />
      </XStack>
      <NewFeed fid={community.fid} />
    </Content>
  )
}
