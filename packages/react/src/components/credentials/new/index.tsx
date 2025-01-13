import { CredentialType, Vault } from '@anonworld/common'
import { NewCredentialDialog } from './dialog'
import { Button, Text, XStack } from '@anonworld/ui'
import { Dialog } from '@anonworld/ui'
import { AuthKitProvider } from '@farcaster/auth-kit'
import { Plus } from '@tamagui/lucide-icons'
import { ReactNode } from 'react'

export function NewCredential({
  parentId,
  initialTokenId,
  initialBalance,
  initialCredentialType,
  vault,
  children,
}: {
  parentId?: string
  initialTokenId?: { chainId: number; address: string }
  initialBalance?: number
  initialCredentialType?: CredentialType
  vault?: Vault
  children?: ReactNode
}) {
  return (
    <AuthKitProvider
      config={{
        rpcUrl: 'https://mainnet.optimism.io',
        domain: 'anon.world',
        siweUri: 'https://anon.world',
        relay: 'https://relay.farcaster.xyz',
      }}
    >
      <NewCredentialDialog
        initialTokenId={initialTokenId}
        initialBalance={initialBalance}
        initialCredentialType={initialCredentialType}
        parentId={parentId}
        vault={vault}
      >
        {children || (
          <Dialog.Trigger asChild>
            <Button
              size="$3"
              bg="$color12"
              br="$12"
              bw="$0"
              disabledStyle={{ opacity: 0.5, bg: '$color12' }}
              hoverStyle={{ opacity: 0.9, bg: '$color12' }}
              pressStyle={{ opacity: 0.9, bg: '$color12' }}
            >
              <XStack ai="center" gap="$2">
                <Plus size={16} strokeWidth={2.5} color="$color1" />
                <Text fos="$2" fow="600" color="$color1">
                  Add Credential
                </Text>
              </XStack>
            </Button>
          </Dialog.Trigger>
        )}
      </NewCredentialDialog>
    </AuthKitProvider>
  )
}
