'use client'

import {
  CommunityDisplay,
  NewFeed,
  SwapTokens,
  NewCommunityPost,
  useCommunity,
} from '@anonworld/react'
import { Text, View, XStack } from '@anonworld/ui'
import { Content } from '@/components/content'
import { useFrames } from './providers/frames'
import Link from 'next/link'

export function CommunityPage({ id }: { id: string }) {
  const { data: community } = useCommunity({ id })
  const { isFrame } = useFrames()

  if (!community) {
    return null
  }

  return (
    <Content>
      <CommunityDisplay community={community} disableActions={isFrame} />
      {!isFrame && (
        <XStack ai="center" jc="space-between" $xs={{ px: '$2' }}>
          <XStack gap="$2">
            <View
              bg="$color12"
              py="$2"
              px="$3"
              br="$12"
              hoverStyle={{
                opacity: 0.9,
                bg: '$color12',
              }}
              cursor="pointer"
            >
              <Text fow="600" fos="$2" color="$color1">
                Posts
              </Text>
            </View>
            <Link
              href={`/communities/${id}/leaderboard`}
              style={{ textDecoration: 'none' }}
            >
              <View
                bg="$color1"
                py="$2"
                px="$3"
                br="$12"
                hoverStyle={{
                  opacity: 0.9,
                  bg: '$color5',
                }}
                cursor="pointer"
              >
                <Text fow="600" fos="$2" color="$color12">
                  Leaderboard
                </Text>
              </View>
            </Link>
          </XStack>
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
      )}
      <NewFeed fid={community.fid} disableActions={isFrame} />
    </Content>
  )
}
