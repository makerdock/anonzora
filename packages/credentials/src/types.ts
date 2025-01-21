import { CredentialType } from '@anonworld/common'
import { FarcasterFidArgs, FarcasterFidPublicData } from './verifiers/farcaster-fid'
import { TokenBalanceArgs, TokenBalancePublicData } from './verifiers/token-balance'
import { NativeBalanceArgs, NativeBalancePublicData } from './verifiers/native-balance'

export type CredentialPublicData =
  | FarcasterFidPublicData
  | TokenBalancePublicData
  | NativeBalancePublicData

export type CredentialArgsTypeMap = {
  [CredentialType.FARCASTER_FID]: FarcasterFidArgs
  [CredentialType.ERC20_BALANCE]: TokenBalanceArgs
  [CredentialType.ERC721_BALANCE]: TokenBalanceArgs
  [CredentialType.NATIVE_BALANCE]: NativeBalanceArgs
}

export type CredentialMetadataMap = {
  [CredentialType.FARCASTER_FID]: FarcasterFidPublicData
  [CredentialType.ERC20_BALANCE]: TokenBalancePublicData
  [CredentialType.ERC721_BALANCE]: TokenBalancePublicData
  [CredentialType.NATIVE_BALANCE]: NativeBalancePublicData
}
