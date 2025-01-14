'use client'

import { Content } from '@/components/content'
import { CredentialDisplay, CredentialPostFeed, useCredential } from '@anonworld/react'
import { Text, View, XStack, YStack } from '@anonworld/ui'

export default function Page({ params }: { params: { hash: string } }) {
  const { data: credential } = useCredential({ hash: params.hash })
  if (!credential) return null
  return (
    <Content>
      <YStack gap="$4">
        <YStack
          theme="surface1"
          themeShallow
          bg="$background"
          bc="$borderColor"
          bw="$0.5"
          p="$3"
          gap="$4"
          br="$4"
          $xs={{
            br: '$0',
            bw: '$0',
            btw: '$0.5',
          }}
          fs={1}
        >
          <CredentialDisplay credential={credential} />
        </YStack>
        <XStack gap="$2" $xs={{ px: '$2' }}>
          <View bg="$color12" py="$2" px="$3" br="$12">
            <Text fow="600" fos="$2" color="$color1">
              Posts
            </Text>
          </View>
        </XStack>
        <CredentialPostFeed hash={params.hash} />
      </YStack>
    </Content>
  )
}
