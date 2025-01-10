export type SwapQuote = {
  buyAmount: string
  liquidityAvailable: true
  transaction?: {
    to: `0x${string}`
    value: string
    data: `0x${string}`
    gas: string
    gasPrice: string
  }
  permit2: {
    type: string
    hash: string
    eip712: {
      types: {
        EIP712Domain: Array<{
          name: string
          type: string
        }>
        TokenPermissions: Array<{
          name: string
          type: string
        }>
        PermitTransferFrom: Array<{
          name: string
          type: string
        }>
      }
      domain: {
        name: string
        chainId: number
        verifyingContract: `0x${string}`
      }
      message: {
        permitted: {
          token: string
          amount: string
        }
        spender: string
        nonce: string
        deadline: string
      }
      primaryType: string
    }
  }
}

export type SwapQuoteError = {
  liquidityAvailable: false
  error: string
}
