import { Token } from './token'
import { Vault } from './vaults'

export enum CredentialType {
  ERC20_BALANCE = 'ERC20_BALANCE',
  ERC721_BALANCE = 'ERC721_BALANCE',
  NATIVE_BALANCE = 'NATIVE_BALANCE',
  FARCASTER_FID = 'FARCASTER_FID',
}

export type CredentialProof = {
  proof: number[]
  publicInputs: string[]
}

export type ProofData = {
  proof: Uint8Array
  publicInputs: string[]
}

export type TokenBalanceMetadata = {
  chainId: number
  tokenAddress: string
  balance: string
}

export type FarcasterFidMetadata = {
  fid: number
}

export type NativeBalanceMetadata = {
  chainId: number
  balance: string
}

type BaseCredential = {
  id?: string
  hash: string
  credential_id: string
  proof?: CredentialProof
  verified_at: string | Date
  token?: Token
  vault_id: string | null
  vault?: Omit<Vault, 'credentials'> | null
  parent_id?: string | null
  reverified_id?: string | null
}

export type ERC20BalanceCredential = BaseCredential & {
  type: CredentialType.ERC20_BALANCE
  metadata: TokenBalanceMetadata
}

export type ERC721BalanceCredential = BaseCredential & {
  type: CredentialType.ERC721_BALANCE
  metadata: TokenBalanceMetadata
}

export type FarcasterFidCredential = BaseCredential & {
  type: CredentialType.FARCASTER_FID
  metadata: FarcasterFidMetadata
}

export type NativeBalanceCredential = BaseCredential & {
  type: CredentialType.NATIVE_BALANCE
  metadata: NativeBalanceMetadata
}

export type Credential =
  | ERC20BalanceCredential
  | ERC721BalanceCredential
  | FarcasterFidCredential
  | NativeBalanceCredential
export type CredentialWithId = Credential & { id: string }

export type ERC20CredentialRequirement = {
  chainId: number
  tokenAddress: `0x${string}`
  minimumBalance: string
}

export type ERC721CredentialRequirement = {
  chainId: number
  tokenAddress: `0x${string}`
  minimumBalance: string
}

export type FarcasterFidCredentialRequirement = {
  fid: number
}

export type NativeCredentialRequirement = {
  chainId: number
  minimumBalance: string
}

export type CredentialRequirement =
  | ERC20CredentialRequirement
  | ERC721CredentialRequirement
  | FarcasterFidCredentialRequirement
  | NativeCredentialRequirement

export type CredentialRequirementTypeMap = {
  [CredentialType.ERC20_BALANCE]: ERC20CredentialRequirement
  [CredentialType.ERC721_BALANCE]: ERC721CredentialRequirement
  [CredentialType.FARCASTER_FID]: FarcasterFidCredentialRequirement
  [CredentialType.NATIVE_BALANCE]: NativeCredentialRequirement
}

export type CredentialRequirements =
  | {
      type: CredentialType.ERC20_BALANCE
      data: ERC20CredentialRequirement
    }
  | {
      type: CredentialType.ERC721_BALANCE
      data: ERC721CredentialRequirement
    }
  | {
      type: CredentialType.FARCASTER_FID
      data: FarcasterFidCredentialRequirement
    }
  | {
      type: CredentialType.NATIVE_BALANCE
      data: NativeCredentialRequirement
    }
