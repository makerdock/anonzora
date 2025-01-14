'use client'

import {
  CommunityDisplay,
  NewFeed,
  SwapTokens,
  NewCommunityPost,
  useCommunity,
  TrendingFeed,
} from '@anonworld/react'
import { Content } from '@/components/content'
import { useFrames } from './providers/frames'
import Link from 'next/link'
import { Button, Popover, Text, View, XStack, YGroup } from '@anonworld/ui'
import { ChevronDown } from '@tamagui/lucide-icons'
import { useState } from 'react'

export function CommunityPage({ id }: { id: string }) {
  const [selected, setSelected] = useState<'new' | 'trending'>('trending')
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
      <XStack ai="center" jc="space-between">
        <View />
        <PostFeedSelector selected={selected} onSelect={setSelected} />
      </XStack>
      {selected === 'trending' ? (
        <TrendingFeed fid={community.fid} disableActions={isFrame} />
      ) : (
        <NewFeed fid={community.fid} disableActions={isFrame} />
      )}
    </Content>
  )
}

export function PostFeedSelector({
  selected,
  onSelect,
}: {
  selected: 'new' | 'trending'
  onSelect: (selected: 'new' | 'trending') => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <View ai="flex-end">
      <Popover size="$5" placement="bottom" open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger
          onPress={(e) => {
            e.stopPropagation()
          }}
          asChild
        >
          <Button size="$3" bg="$color1" br="$12" bw="$0">
            <XStack gap="$2" ai="center">
              <Text fos="$2" fow="400" color="$color11">
                {selected.charAt(0).toUpperCase() + selected.slice(1)}
              </Text>
              <ChevronDown size={16} color="$color11" />
            </XStack>
          </Button>
        </Popover.Trigger>
        <Popover.Content
          enterStyle={{ y: -10, opacity: 0 }}
          exitStyle={{ y: -10, opacity: 0 }}
          elevate
          animation={[
            '100ms',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          padding="$0"
          cursor="pointer"
          bordered
          overflow="hidden"
        >
          <YGroup>
            <ActionButton label="Sort by" fow="600" bbw="$0.5" />
            <ActionButton
              label="Trending"
              onPress={() => {
                onSelect('trending')
                setIsOpen(false)
              }}
            />
            <ActionButton
              label="New"
              onPress={() => {
                onSelect('new')
                setIsOpen(false)
              }}
            />
          </YGroup>
        </Popover.Content>
      </Popover>
    </View>
  )
}

function ActionButton({
  label,
  onPress,
  fow = '400',
  bbw = '$0',
}: {
  label: string
  onPress?: () => void
  fow?: '400' | '600'
  bbw?: '$0' | '$0.5'
}) {
  return (
    <YGroup.Item>
      <View
        onPress={onPress}
        fd="row"
        ai="center"
        gap="$2"
        px="$3.5"
        py="$2.5"
        hoverStyle={bbw === '$0' ? { bg: '$color5' } : {}}
        bbw={bbw}
        bc="$borderColor"
      >
        <Text fos="$2" fow={fow}>
          {label}
        </Text>
      </View>
    </YGroup.Item>
  )
}
