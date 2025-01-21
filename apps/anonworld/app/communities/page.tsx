'use client'

import { CommunityFeed, CommunityFeedSelector } from '@anonworld/react'
import { Text, View, XStack } from '@anonworld/ui'
import { NewCommunity } from '@anonworld/react'
import { Content } from '@/components/content'
import { useState } from 'react'
import { Gift } from '@tamagui/lucide-icons'

export default function CommunitiesPage() {
  const [selected, setSelected] = useState<'popular' | 'new' | 'rewards'>('popular')
  const [onlyRewards, setOnlyRewards] = useState(false)

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
