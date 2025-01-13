'use client'

import {
  CredentialDisplay,
  CredentialWithId,
  NewCredential,
  useCredentials,
  VaultAvatar,
  VaultSettings,
} from '@anonworld/react'
import { Dialog, Text, View, XStack, YStack } from '@anonworld/ui'
import { Content } from '@/components/content'
import { useMemo } from 'react'
import { Settings } from '@tamagui/lucide-icons'

export default function Credentials() {
  const { credentials } = useCredentials()

  const vaults = useMemo(
    () =>
      credentials.reduce(
        (acc, credential) => {
          const vaultId = credential.vault_id ?? ''
          acc[vaultId] = {
            vault: credential.vault,
            credentials: [...(acc[vaultId]?.credentials || []), credential].sort(
              (a, b) =>
                new Date(b.verified_at).getTime() - new Date(a.verified_at).getTime()
            ),
          }
          return acc
        },
        {} as Record<
          string,
          {
            vault?: CredentialWithId['vault']
            credentials: CredentialWithId[]
          }
        >
      ),
    [credentials]
  )

  return (
    <Content>
      <XStack ai="center" jc="space-between" $xs={{ px: '$2' }}>
        <View />
        <NewCredential />
      </XStack>
      <YStack gap="$4" $xs={{ gap: '$0', bbw: '$0.5', bc: '$borderColor' }}>
        {Object.values(vaults)
          .sort((a, b) => {
            if (!a.vault && !b.vault) return 0
            if (!a.vault) return 1
            if (!b.vault) return -1
            return 0
          })
          .map((vault, i) => (
            <YStack
              key={i}
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
                px: '$2',
                py: '$3',
              }}
              fs={1}
            >
              <XStack ai="center" jc="space-between">
                <XStack ai="center" gap="$2">
                  <VaultAvatar
                    vaultId={vault.vault?.id}
                    imageUrl={vault.vault?.image_url}
                    size="$2"
                  />
                  <Text fos="$3" fow="600">
                    {vault.vault?.username ?? 'Anonymous'}
                  </Text>
                </XStack>
                {vault.vault && (
                  <VaultSettings vault={vault.vault}>
                    <Dialog.Trigger>
                      <XStack
                        p="$2"
                        br="$12"
                        hoverStyle={{ bg: '$color5' }}
                        cursor="pointer"
                      >
                        <Settings size={16} />
                      </XStack>
                    </Dialog.Trigger>
                  </VaultSettings>
                )}
              </XStack>
              <YStack>
                {vault.credentials.map((credential) => (
                  <CredentialDisplay key={credential.id} credential={credential} />
                ))}
              </YStack>
            </YStack>
          ))}
      </YStack>
    </Content>
  )
}
