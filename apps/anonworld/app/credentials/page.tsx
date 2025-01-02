'use client'

import { CredentialDisplay, NewCredential, useCredentials } from '@anonworld/react'
import { Text, XStack, YStack } from '@anonworld/ui'
import { Content } from '@/components/content'

export default function Credentials() {
  const { credentials } = useCredentials()

  const sortedCredentials = credentials.sort((a, b) => {
    return new Date(b.verified_at).getTime() - new Date(a.verified_at).getTime()
  })

  return (
    <Content>
      <XStack ai="center" jc="space-between" $xs={{ px: '$2' }}>
        <Text fos="$2" fow="400" color="$color11">
          {`${sortedCredentials.length} Credential${sortedCredentials.length === 1 ? '' : 's'}`}
        </Text>
        <NewCredential />
      </XStack>
      <YStack gap="$4" $xs={{ gap: '$0', bbw: '$0.5', bc: '$borderColor' }}>
        {sortedCredentials.map((credential) => (
          <CredentialDisplay key={credential.id} credential={credential} />
        ))}
      </YStack>
    </Content>
  )
}
