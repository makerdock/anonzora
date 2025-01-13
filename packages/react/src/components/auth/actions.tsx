import { Check, LogOut } from '@tamagui/lucide-icons'
import { Popover, Text, XStack, YGroup } from '@anonworld/ui'
import { NamedExoticComponent, ReactNode, useState } from 'react'
import { useAuth, useCredentials } from '../../providers'
import { formatHexId } from '@anonworld/common'
import { VaultAvatar } from '../vaults/avatar'

export function AuthActions() {
  const { logout, passkeyId } = useAuth()
  const { vault } = useCredentials()
  const [isOpen, setIsOpen] = useState(false)

  if (!passkeyId) {
    return null
  }

  return (
    <Popover size="$5" placement="bottom" open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger
        onPress={(e) => {
          e.stopPropagation()
        }}
        cursor="pointer"
      >
        <VaultAvatar vaultId={vault?.id} imageUrl={vault?.image_url} size={32} />
      </Popover.Trigger>
      <Popover.Content
        enterStyle={{ y: -10, opacity: 0 }}
        exitStyle={{ y: -10, opacity: 0 }}
        elevate
        animation={[
          '100ms',
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
        padding="$0"
        bordered
        overflow="hidden"
      >
        {isOpen && (
          <YGroup>
            <VaultSelect />
            <ActionItem label="Logout" onPress={logout} Icon={LogOut} destructive />
          </YGroup>
        )}
      </Popover.Content>
    </Popover>
  )
}

function VaultSelect() {
  const { vaults, vault: selectedVault, switchVault } = useCredentials()

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
            selected={vault.id === selectedVault?.id}
            onPress={() => switchVault(vault)}
          />
        )
      })}
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
}: {
  label: string
  onPress?: () => void
  Icon?: NamedExoticComponent<any>
  image?: ReactNode
  destructive?: boolean
  selected?: boolean
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
      >
        <XStack ai="center" gap="$2">
          {Icon && <Icon size={16} color={destructive ? '$red9' : undefined} />}
          {image}
          <Text fos="$2" fow="400" color={destructive ? '$red9' : undefined}>
            {label}
          </Text>
        </XStack>
        {selected && <Check size={16} color="$color12" />}
      </XStack>
    </YGroup.Item>
  )
}
