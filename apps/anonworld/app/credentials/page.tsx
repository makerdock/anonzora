'use client'

import {
  CredentialDisplay,
  CredentialWithId,
  formatHexId,
  NewCredential,
  NewVault,
  useAuth,
  useClaims,
  useCredentials,
  Vault,
  VaultAvatar,
  VaultSettings,
} from '@anonworld/react'
import {
  Button,
  Dialog,
  Separator,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from '@anonworld/ui'
import { Content } from '@/components/content'
import { Gift, Plus, Settings } from '@tamagui/lucide-icons'
import Link from 'next/link'

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
      <ClaimsDisplay />
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

function ClaimsDisplay() {
  const { data } = useClaims()
  if (!data || data.length === 0) return null

  return (
    <View bg="$green1" p="$3" br="$4" bc="$green8" bw="$0.5" gap="$3" $xs={{ mx: '$3' }}>
      <XStack ai="center" gap="$2">
        <Gift size={16} color="$green12" />
        <Text fos="$2" fow="600" color="$green12">
          Rewards
        </Text>
      </XStack>
      <Text fos="$2" fow="600" color="$green12">
        You've earned {data.length * 0.1} ETH in rewards from your posts last week.
      </Text>
      <Text fos="$2" fow="400" color="$green12">
        Rewards are anonymously claimable in 0.1 ETH increments through Veil.
      </Text>
      <XStack ai="center" gap="$2" jc="flex-end">
        {data.map((c, i) => (
          <Link
            key={c.credential_id}
            href={`https://www.veil.cash/link#${c.note}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="$2"
              bg="$green12"
              px="$2.5"
              br="$12"
              bw="$0"
              disabledStyle={{ opacity: 0.5, bg: '$green12' }}
              hoverStyle={{ opacity: 0.9, bg: '$green12' }}
              pressStyle={{ opacity: 0.9, bg: '$green12' }}
            >
              <Text fos="$2" fow="600" color="$green1">
                {data.length > 1 ? `${i + 1}. Claim 0.1 ETH` : 'Claim 0.1 ETH'}
              </Text>
            </Button>
          </Link>
        ))}
      </XStack>
    </View>
  )
}
