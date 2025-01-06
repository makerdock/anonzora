'use client'

import {
  PostDisplay,
  PostConversation,
  ReplyBar,
  usePostConversation,
  Post,
} from '@anonworld/react'
import { View, YStack, Spinner } from '@anonworld/ui'
import { Content } from '@/components/content'

export function PostPage({ post }: { post: Post }) {
  const { data: conversation, isLoading: conversationLoading } = usePostConversation({
    hash: post.hash,
  })

  return (
    <Content gap="$6">
      <YStack gap="$3">
        {post && (
          <View $xs={{ bbw: '$0.5', bc: '$borderColor' }}>
            <PostDisplay post={post} />
          </View>
        )}
        {post && <ReplyBar post={post} />}
      </YStack>
      {conversationLoading && <Spinner color="$color12" />}
      {conversation && <PostConversation conversation={conversation} />}
    </Content>
  )
}
