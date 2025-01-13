import { RefreshCw, Trash, UserRound } from '@tamagui/lucide-icons'
import { Dialog, Text, YGroup, XStack } from '@anonworld/ui'
import { CredentialType, formatHexId } from '@anonworld/common'
import { NewCredential, useCredentials, useToken, VaultAvatar } from '../../../..'
import { NamedExoticComponent, ReactNode } from 'react'
import { CredentialWithId } from '@anonworld/common'
import { formatUnits } from 'viem'
import { Check } from '@tamagui/lucide-icons'

export function CredentialActionsContent({
  credential,
}: {
  credential: CredentialWithId
}) {
  const { delete: deleteCredential } = useCredentials()

  return (
    <YGroup>
      <ActionItem label="Profile" fow="600" bbw="$0.5" />
      <VaultSelect credential={credential} />
      <ReverifyButton credential={credential} />
      <ActionItem
        label="Delete"
        onPress={() => deleteCredential(credential.id)}
        Icon={Trash}
        destructive
      />
    </YGroup>
  )
}

function ReverifyButton({
  credential,
}: {
  credential: CredentialWithId
}) {
  const { data: token } = useToken(
    credential.type === CredentialType.ERC20_BALANCE
      ? {
          chainId: credential.metadata.chainId,
          address: credential.metadata.tokenAddress,
        }
      : undefined
  )

  return (
    <NewCredential
      initialCredentialType={credential.type}
      initialBalance={
        credential.type === CredentialType.ERC20_BALANCE
          ? Number(
              formatUnits(BigInt(credential.metadata.balance), token?.decimals ?? 18)
            )
          : undefined
      }
      initialTokenId={
        credential.type === CredentialType.ERC20_BALANCE
          ? {
              chainId: credential.metadata.chainId,
              address: credential.metadata.tokenAddress,
            }
          : undefined
      }
      parentId={credential.id}
    >
      <Dialog.Trigger asChild>
        <ActionItem label="Reverify" Icon={RefreshCw} />
      </Dialog.Trigger>
    </NewCredential>
  )
}

function VaultSelect({ credential }: { credential: CredentialWithId }) {
  const { vaults, addToVault, removeFromVault } = useCredentials()

  return (
    <>
      {vaults.map((vault) => {
        const displayId = formatHexId(vault.id)
        return (
          <ActionItem
            key={vault.id}
            label={vault.username ?? displayId}
            image={
              <VaultAvatar vaultId={vault.id} imageUrl={vault.image_url} size={16} />
            }
            selected={vault.id === credential.vault_id}
            onPress={() => {
              if (vault.id !== credential.vault_id) {
                addToVault(vault, credential)
              }
            }}
          />
        )
      })}
      <ActionItem
        label="Anonymous"
        image={<VaultAvatar size={16} />}
        selected={!credential.vault_id}
        onPress={() => {
          if (credential.vault_id) {
            removeFromVault(credential.vault_id, credential)
          }
        }}
        bbw="$0.5"
      />
    </>
  )
}

function ActionItem({
  label,
  onPress,
  Icon,
  image,
  destructive = false,
  selected = false,
  fow = '400',
  bbw = '$0',
}: {
  label: string
  onPress?: () => void
  Icon?: NamedExoticComponent<any>
  image?: ReactNode
  destructive?: boolean
  selected?: boolean
  fow?: '400' | '600'
  bbw?: '$0' | '$0.5'
}) {
  return (
    <YGroup.Item>
      <XStack
        onPress={onPress}
        jc="space-between"
        ai="center"
        gap="$2"
        px="$3.5"
        py="$2.5"
        hoverStyle={onPress ? { bg: '$color5' } : {}}
        cursor={onPress ? 'pointer' : 'default'}
        bbw={bbw}
        bc="$borderColor"
      >
        <XStack ai="center" gap="$2">
          {Icon && <Icon size={16} color={destructive ? '$red9' : undefined} />}
          {image}
          <Text fos="$2" fow={fow} color={destructive ? '$red9' : undefined}>
            {label}
          </Text>
        </XStack>
        {selected && <Check size={16} color="$color12" />}
      </XStack>
    </YGroup.Item>
  )
}
