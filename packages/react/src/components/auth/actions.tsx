import { LogOut, Pencil } from '@tamagui/lucide-icons'
import { Dialog, Popover, Text, View, YGroup } from '@anonworld/ui'
import { NamedExoticComponent, ReactNode, useState } from 'react'
import { useAuth } from '../../providers'
import { formatHexId } from '@anonworld/common'
import { useVaults } from '../../hooks/use-vaults'
import { VaultAvatar } from '../vaults/avatar'
import { Link } from 'solito/link'
import { VaultSettings } from '../vaults/settings'

export function AuthActions() {
  const { logout } = useAuth()
  const { data: vaults } = useVaults()
  const id = formatHexId(vaults?.[0]?.id ?? '')
  const [isOpen, setIsOpen] = useState(false)

  const vault = vaults?.[0]

  if (!vault) {
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
        <VaultAvatar vaultId={vault.id} imageUrl={vault.image_url} size={32} />
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
        {vault && isOpen && (
          <YGroup>
            <VaultSettings vault={vault}>
              <Dialog.Trigger asChild>
                <ActionItem Icon={Pencil} label="Edit Profile" />
              </Dialog.Trigger>
            </VaultSettings>
            {vaults?.map((vault) => {
              const displayId = formatHexId(vault.id)
              return (
                <Link key={vault.id} href={`/profiles/${vault.id}`}>
                  <ActionItem
                    label={vault.username ?? displayId}
                    image={
                      <VaultAvatar
                        vaultId={vault.id}
                        imageUrl={vault.image_url}
                        size={16}
                      />
                    }
                  />
                </Link>
              )
            })}
            <ActionItem label="Logout" onPress={logout} Icon={LogOut} destructive />
          </YGroup>
        )}
      </Popover.Content>
    </Popover>
  )
}

function ActionItem({
  label,
  onPress,
  Icon,
  image,
  destructive = false,
}: {
  label: string
  onPress?: () => void
  Icon?: NamedExoticComponent<any>
  image?: ReactNode
  destructive?: boolean
}) {
  return (
    <YGroup.Item>
      <View
        onPress={onPress}
        fd="row"
        ai="center"
        gap="$2"
        px="$3.5"
        py="$2.5"
        hoverStyle={onPress ? { bg: '$color5' } : {}}
        cursor={onPress ? 'pointer' : 'default'}
      >
        {Icon && <Icon size={16} color={destructive ? '$red9' : undefined} />}
        {image}
        <Text fos="$2" fow="400" color={destructive ? '$red9' : undefined}>
          {label}
        </Text>
      </View>
    </YGroup.Item>
  )
}
