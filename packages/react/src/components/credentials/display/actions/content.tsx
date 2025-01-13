import { Plus, Minus, RefreshCw, Trash } from '@tamagui/lucide-icons'
import { Dialog, Spinner, Text, View, YGroup } from '@anonworld/ui'
import { CredentialType } from '@anonworld/common'
import { NewCredential, useCredentials, useToken } from '../../../..'
import { useVaults } from '../../../../hooks/use-vaults'
import { NamedExoticComponent, useState } from 'react'
import { CredentialWithId } from '@anonworld/common'
import { formatUnits } from 'viem'

export function CredentialActionsContent({
  credential,
}: {
  credential: CredentialWithId
}) {
  const credentials = useCredentials()
  const { data: vaults } = useVaults()

  return (
    <YGroup>
      {!credential.vault_id && vaults && vaults.length > 0 && (
        <ActionButton
          label="Add to profile"
          onPress={async () => {
            if (!vaults || vaults.length === 0) return
            await credentials.addToVault(vaults[0], credential.id)
          }}
          Icon={Plus}
        />
      )}
      {credential.vault_id && vaults && vaults.length > 0 && (
        <ActionButton
          label="Remove from profile"
          onPress={async () => {
            if (!credential.vault_id) return
            await credentials.removeFromVault(credential.vault_id, credential.id)
          }}
          Icon={Minus}
        />
      )}
      <ReverifyButton credential={credential} />
      <ActionButton
        label="Delete"
        onPress={() => credentials.delete(credential.id)}
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
        <ActionButton label="Reverify" Icon={RefreshCw} />
      </Dialog.Trigger>
    </NewCredential>
  )
}

function ActionButton({
  label,
  onPress,
  Icon,
  destructive = false,
}: {
  label: string
  onPress?: () => Promise<void> | void
  Icon?: NamedExoticComponent<any>
  destructive?: boolean
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePress = async () => {
    setIsLoading(true)
    try {
      await onPress?.()
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <YGroup.Item>
      <View
        onPress={onPress ? handlePress : undefined}
        fd="row"
        ai="center"
        gap="$2"
        px="$3.5"
        py="$2.5"
        hoverStyle={{ bg: '$color5' }}
      >
        {isLoading && <Spinner color="$color12" />}
        {Icon && !isLoading && (
          <Icon size={16} color={destructive ? '$red9' : undefined} />
        )}
        <Text fos="$2" fow="400" color={destructive ? '$red9' : undefined}>
          {label}
        </Text>
      </View>
    </YGroup.Item>
  )
}
