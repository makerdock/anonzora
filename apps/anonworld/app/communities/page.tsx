'use client'

import { CommunityFeed, CommunityFeedSelector } from '@anonworld/react'
import { XStack } from '@anonworld/ui'
import { NewCommunity } from '@anonworld/react'
import { Content } from '@/components/content'
import { useState } from 'react'

export default function CommunitiesPage() {
  const [selected, setSelected] = useState<'popular' | 'new'>('popular')

  return (
    <Content>
      <XStack ai="center" jc="space-between" $xs={{ px: '$2' }}>
        <CommunityFeedSelector selected={selected} onSelect={setSelected} />
        <NewCommunity />
      </XStack>
      <CommunityFeed sort={selected} />
    </Content>
  )
}
