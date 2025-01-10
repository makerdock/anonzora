'use client'

import {
  PostDisplay,
  PostConversation,
  ReplyBar,
  usePostConversation,
  Post,
  usePost,
} from '@anonworld/react'
import { View, YStack, Spinner } from '@anonworld/ui'
import { Content } from '@/components/content'
import { useFrames } from './providers/frames'

export function PostPage({ hash }: { hash: string }) {
  const { data: post } = usePost({ hash })
  const { isFrame } = useFrames()
  const { data: conversation, isLoading: conversationLoading } = usePostConversation({
    hash,
  })

  return (
    <Content gap="$6">
      <YStack gap="$3">
        {post && (
          <View $xs={{ bbw: '$0.5', bc: '$borderColor' }}>
            <PostDisplay post={post} disableActions={isFrame} />
          </View>
        )}
        {post && !isFrame && <ReplyBar post={post} />}
      </YStack>
      {conversationLoading && <Spinner color="$color12" />}
      {conversation && (
        <PostConversation conversation={conversation} disableActions={isFrame} />
      )}
    </Content>
  )
}
