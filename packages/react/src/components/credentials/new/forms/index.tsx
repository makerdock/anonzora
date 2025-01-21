import { View } from '@anonworld/ui'
import { CredentialType, Vault } from '@anonworld/common'
import { ERC20CredentialForm } from './erc20-balance'
import { ERC721CredentialForm } from './erc721-balance'
import { FarcasterFidForm } from './farcaster-fid'
import { NativeBalanceCredentialForm } from './native-balance'

export function NewCredentialForm({
  credentialType,
  initialTokenId,
  initialBalance,
  isOpen,
  setIsOpen,
  parentId,
  vault,
}: {
  credentialType: CredentialType
  initialTokenId?: { chainId: number; address: string }
  initialBalance?: number
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  parentId?: string
  vault?: Vault
}) {
  if (credentialType === CredentialType.ERC20_BALANCE) {
    return (
      <ERC20CredentialForm
        initialTokenId={initialTokenId}
        initialBalance={initialBalance}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        parentId={parentId}
        vault={vault}
      />
    )
  }
  if (credentialType === CredentialType.ERC721_BALANCE) {
    return (
      <ERC721CredentialForm
        initialTokenId={initialTokenId}
        initialBalance={initialBalance}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        parentId={parentId}
        vault={vault}
      />
    )
  }
  if (credentialType === CredentialType.FARCASTER_FID) {
    return (
      <FarcasterFidForm
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        parentId={parentId}
        vault={vault}
      />
    )
  }
  if (credentialType === CredentialType.NATIVE_BALANCE) {
    return (
      <NativeBalanceCredentialForm
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        parentId={parentId}
        vault={vault}
      />
    )
  }
  return <View />
}
