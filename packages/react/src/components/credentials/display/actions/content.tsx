import { RefreshCw, Trash, UserRound, X } from '@tamagui/lucide-icons'
import {
  Dialog,
  Text,
  YGroup,
  XStack,
  View,
  Unspaced,
  Sheet,
  Adapt,
  Button,
  Spinner,
} from '@anonworld/ui'
import { CredentialType, formatHexId } from '@anonworld/common'
import { NewCredential, useCredentials, useToken, VaultAvatar } from '../../../..'
import { NamedExoticComponent, ReactNode, useState } from 'react'
import { CredentialWithId } from '@anonworld/common'
import { formatUnits } from 'viem'
import { Check } from '@tamagui/lucide-icons'
import { useMutation } from '@tanstack/react-query'

export function CredentialActionsContent({
  credential,
}: {
  credential: CredentialWithId
}) {
  return (
    <YGroup>
      <ActionItem label="Profile" fow="600" bbw="$0.5" />
      <VaultSelect credential={credential} />
      <ReverifyButton credential={credential} />
      <DeleteButton credential={credential} />
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

function DeleteButton({ credential }: { credential: CredentialWithId }) {
  const { delete: deleteCredential } = useCredentials()
  const [isOpen, setIsOpen] = useState(false)
  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteCredential(credential.id),
    onSuccess: () => {
      setIsOpen(false)
    },
  })

  return (
    <Dialog modal open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <ActionItem
          label="Delete"
          onPress={() => setIsOpen(true)}
          Icon={Trash}
          destructive
        />
      </Dialog.Trigger>

      <Adapt when="sm">
        <Sheet
          animation="quicker"
          zIndex={200000}
          modal
          dismissOnSnapToBottom
          snapPointsMode="fit"
        >
          {isOpen && (
            <Sheet.Frame padding="$3" pb="$5" gap="$3" bg="$color2">
              <Adapt.Contents />
            </Sheet.Frame>
          )}
          <Sheet.Overlay
            animation="quicker"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
        </Sheet>
      </Adapt>

      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quicker"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />

        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quicker',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          gap="$3"
          w={600}
        >
          <Dialog.Title fos="$5">Delete Credential</Dialog.Title>
          <Dialog.Description fow="400">
            Deleting a credential will permanently remove all data associated with it,
            including leaderboard positions. This is an irreversible action. Are you sure
            you want to delete this credential?
          </Dialog.Description>
          <View ai="flex-end" jc="flex-end">
            <Button
              bg="$red8"
              br="$4"
              disabledStyle={{ opacity: 0.5, bg: '$red8' }}
              hoverStyle={{ opacity: 0.9, bg: '$red8' }}
              pressStyle={{ opacity: 0.9, bg: '$red8' }}
              onPress={() => {
                mutate()
              }}
              disabled={isPending}
            >
              {!isPending ? (
                <Text fos="$3" fow="600" color="$color12">
                  Delete
                </Text>
              ) : (
                <XStack gap="$2" alignItems="center">
                  <Spinner color="$color12" />
                  <Text fos="$2" fow="600" color="$color12">
                    Deleting
                  </Text>
                </XStack>
              )}
            </Button>
          </View>
          <Unspaced>
            <Dialog.Close asChild>
              <View
                bg="$background"
                p="$2"
                br="$12"
                hoverStyle={{ bg: '$color5' }}
                cursor="pointer"
                pos="absolute"
                top="$3"
                right="$3"
              >
                <X size={20} />
              </View>
            </Dialog.Close>
          </Unspaced>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
