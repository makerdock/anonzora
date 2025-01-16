'use client'

import {
  CredentialDisplay,
  CredentialWithId,
  formatHexId,
  NewCredential,
  NewVault,
  useAuth,
  useCredentials,
  Vault,
  VaultAvatar,
  VaultSettings,
} from '@anonworld/react'
import { Dialog, Separator, Spinner, Text, View, XStack, YStack } from '@anonworld/ui'
import { Content } from '@/components/content'
import { Plus, Settings } from '@tamagui/lucide-icons'

export default function Credentials() {
  const { vaults, localCredentials, isInitialized } = useCredentials()
  const { passkeyId } = useAuth()

  if (!isInitialized) {
    return (
      <View ai="center" jc="center" f={1} p="$4">
        <Spinner color="$color12" />
      </View>
    )
  }

  return (
    <Content>
      <XStack ai="center" jc="space-between" $xs={{ px: '$2' }}>
        <View />
        <XStack gap="$2" ai="center">
          {passkeyId && <NewVault />}
          <NewCredential />
        </XStack>
      </XStack>
      <YStack gap="$4">
        {isInitialized && <VaultDisplay credentials={localCredentials} />}
        {Object.values(vaults).map((vault, i) => (
          <VaultDisplay key={vault.id} vault={vault} credentials={vault.credentials} />
        ))}
      </YStack>
    </Content>
  )
}

function VaultDisplay({
  vault,
  credentials,
}: {
  vault?: Vault
  credentials: CredentialWithId[]
}) {
  return (
    <YStack
      theme="surface1"
      themeShallow
      bg="$background"
      bc="$borderColor"
      bw="$0.5"
      p="$3"
      gap="$3"
      br="$4"
      $xs={{
        br: '$0',
        bw: '$0',
        btw: '$0.5',
        bbw: '$0.5',
        px: '$2',
        py: '$3',
      }}
      fs={1}
    >
      <XStack ai="center" jc="space-between">
        <XStack ai="center" gap="$2">
          <VaultAvatar vaultId={vault?.id} imageUrl={vault?.image_url} size="$2" />
          <Text fos="$3" fow="600">
            {vault ? vault.username || formatHexId(vault.id) : 'Anonymous'}
          </Text>
        </XStack>
        <XStack ai="center">
          {vault && (
            <VaultSettings vault={vault}>
              <Dialog.Trigger>
                <XStack p="$2" br="$12" hoverStyle={{ bg: '$color5' }} cursor="pointer">
                  <Settings size={16} />
                </XStack>
              </Dialog.Trigger>
            </VaultSettings>
          )}
          <NewCredential vault={vault}>
            <Dialog.Trigger>
              <XStack p="$2" br="$12" hoverStyle={{ bg: '$color5' }} cursor="pointer">
                <Plus size={16} />
              </XStack>
            </Dialog.Trigger>
          </NewCredential>
        </XStack>
      </XStack>
      {credentials.length > 0 ? (
        <YStack>
          {credentials
            .sort(
              (a, b) =>
                new Date(b.verified_at).getTime() - new Date(a.verified_at).getTime()
            )
            .map((credential, i) => (
              <>
                <Separator
                  key={`${credential.id}-separator`}
                  mb="$2.5"
                  mt={i === 0 ? '$0' : '$2.5'}
                />
                <View key={`${credential.id}-view`} p="$2">
                  <CredentialDisplay credential={credential} />
                </View>
              </>
            ))}
        </YStack>
      ) : (
        <>
          <Separator />
          <View p="$2" ai="center" jc="center">
            <NewCredential vault={vault} />
          </View>
        </>
      )}
    </YStack>
  )
}
