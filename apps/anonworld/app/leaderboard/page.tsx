'use client'

import { Content } from '@/components/content'
import { Leaderboard, NewPost } from '@anonworld/react'
import { Text, View, XStack } from '@anonworld/ui'

export default function LeaderboardPage() {
  return (
    <Content>
      <XStack ai="center" jc="space-between" $xs={{ px: '$2' }}>
        <XStack ai="center" jc="center" gap="$2">
          <Text fow="600" fos="$4">
            Leaderboard
          </Text>
          <View bg="$green9" px="$1.5" py="$1" br="$2">
            <Text fos="$1" fow="600" color="$green12">
              BETA
            </Text>
          </View>
        </XStack>
        <NewPost />
      </XStack>
      <Leaderboard />
    </Content>
  )
}
