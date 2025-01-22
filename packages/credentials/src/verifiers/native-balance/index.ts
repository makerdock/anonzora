import { CredentialType, getChain, ProofData } from '@anonworld/common'
import { formatArray } from '../../utils'
import { formatHexArray } from '../../utils'
import { getPublicKey } from '../../utils'
import { Circuit } from '../../utils/circuit'
import { GetProofReturnType } from 'viem'
import { Verifier } from '../verifier'
import circuit from './circuit/target/0.1.2/main.json'
import vkey from './circuit/target/0.1.2/vkey.json'

export const NATIVE_BALANCE_VERSION = '0.1.2'

export type NativeBalanceArgs = {
  chainId: number
  address: string
  verifiedBalance: bigint
}

export type NativeBalancePublicData = {
  balance: string
  chainId: number
  blockNumber: string
  stateRoot: string
}

export type NativeBalanceInputData = {
  signature: string
  messageHash: string
  stateRoot: string
  accountProof: GetProofReturnType['accountProof']
  chainId: string
  blockNumber: string
  balance: string
  verifiedBalance: string
}

export class NativeBalanceVerifier extends Circuit implements Verifier {
  public type: CredentialType
  public version: string

  constructor(type: CredentialType, version: string) {
    let circuitVersion = version
    if (version === 'latest') {
      circuitVersion = NATIVE_BALANCE_VERSION
    }
    super(circuit, vkey)
    this.type = type
    this.version = circuitVersion
  }

  async buildInput(args: NativeBalanceArgs): Promise<{
    input: Omit<NativeBalanceInputData, 'signature' | 'messageHash'>
    message: string
  }> {
    const chain = getChain(args.chainId)
    const block = await chain.client.getBlock()
    const ethProof = await chain.client.getProof({
      address: args.address as `0x${string}`,
      storageKeys: [],
      blockNumber: block.number,
    })

    const input = {
      stateRoot: block.stateRoot,
      accountProof: ethProof.accountProof,
      chainId: `0x${Number(args.chainId).toString(16)}`,
      blockNumber: `0x${block.number.toString(16)}`,
      balance: `0x${ethProof.balance.toString(16)}`,
      verifiedBalance: `0x${args.verifiedBalance.toString(16)}`,
    }

    const message = JSON.stringify({ ...input, storageProof: undefined })

    return {
      input,
      message,
    }
  }

  async generateProof(args: NativeBalanceInputData) {
    const { pubKeyX, pubKeyY } = await getPublicKey(
      args.signature as `0x${string}`,
      args.messageHash as `0x${string}`
    )

    const nodes = args.accountProof.slice(0, args.accountProof.length - 1)
    const leaf = args.accountProof[args.accountProof.length - 1]

    const input = {
      signature: formatHexArray(args.signature, { length: 64 }),
      message_hash: formatHexArray(args.messageHash),
      pub_key_x: formatHexArray(pubKeyX),
      pub_key_y: formatHexArray(pubKeyY),
      state_root: formatHexArray(args.stateRoot),
      account_nodes: formatArray(
        nodes,
        (node) => formatHexArray(node, { length: 532, pad: 'right' }),
        { length: 10 }
      ),
      account_leaf: formatHexArray(leaf, { length: 142, pad: 'right' }),
      account_depth: args.accountProof.length,
      account_value: args.balance,
      chain_id: args.chainId,
      block_number: args.blockNumber,
      verified_balance: args.verifiedBalance,
    }

    const proof = await super.generate(input)

    return {
      type: this.type,
      version: this.version,
      proof: Array.from(proof.proof),
      publicInputs: proof.publicInputs,
    }
  }

  async verifyProof(proof: ProofData) {
    return super.verify(proof)
  }

  parseData(publicInputs: string[]): NativeBalancePublicData {
    const balance = BigInt(publicInputs[0]).toString()
    const chainId = Number(BigInt(publicInputs[1]).toString())
    const blockNumber = BigInt(publicInputs[2]).toString()
    const stateRoot = `0x${publicInputs
      .slice(3, 3 + 32)
      .map((b) => BigInt(b).toString(16).padStart(2, '0'))
      .join('')}` as string

    return {
      balance,
      chainId,
      blockNumber,
      stateRoot,
    }
  }
}
