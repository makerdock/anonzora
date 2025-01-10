import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useSwapQuote } from '../../../hooks/use-swap-quote'
import { useAccount } from 'wagmi'
import { formatUnits, parseUnits, zeroAddress } from 'viem'
import { base, getZerionChain, SwapQuote, SwapQuoteError, Token } from '@anonworld/common'
import { useDebounceValue } from '@anonworld/ui'
import { useSDK } from '../../../providers'
import { useToken } from '../../../hooks'
import { useWalletFungibles } from '../../../hooks/use-wallet-fungibles'

export type TokenId = {
  chainId: number
  address: string
}

interface SwapTokensContextValue {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  buyToken?: TokenId
  buyTokenData?: Token | null
  sellToken?: TokenId
  sellTokenData?: Token | null
  sellAmount?: string
  setSellAmount: (amount?: string) => void
  buyAmount?: string
  setBuyAmount: (amount?: string) => void
  swapQuote?: SwapQuote | SwapQuoteError | null | undefined
  isSwapQuoteFetching: boolean
  connectWallet: () => void
  invertSwap: () => void
  sellTokenMax: number
}

const SwapTokensContext = createContext<SwapTokensContextValue | null>(null)

export function SwapTokensProvider({
  children,
  initialBuyToken,
  initialSellToken,
}: {
  children: React.ReactNode
  initialBuyToken?: TokenId
  initialSellToken?: TokenId
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [sellToken, setSellToken] = useState<TokenId>(
    initialSellToken ?? {
      chainId: initialBuyToken?.chainId ?? base.id,
      address: zeroAddress,
    }
  )
  const [buyToken, setBuyToken] = useState<TokenId | undefined>(
    initialBuyToken ?? {
      chainId: initialSellToken?.chainId ?? base.id,
      address: zeroAddress,
    }
  )
  const [sellAmount, setSellAmount] = useState<string | undefined>(undefined)
  const [buyAmount, setBuyAmount] = useState<string | undefined>(undefined)
  const { address } = useAccount()

  const { data } = useWalletFungibles()

  const { connectWallet, isConnecting } = useSDK()
  const [isConnectingWallet, setIsConnectingWallet] = useState(false)

  const { data: buyTokenData } = useToken(buyToken)
  const { data: sellTokenData } = useToken(sellToken)

  const sellTokenMax = useMemo(() => {
    if (!data) return 0
    for (const d of data) {
      const chain = getZerionChain(d.relationships.chain.data.id)
      const impl = d.attributes.fungible_info.implementations.find(
        (i) =>
          i.chain_id === chain.zerionId &&
          ((i.address === null && sellToken?.address === zeroAddress) ||
            i.address === sellToken?.address)
      )
      if (impl) {
        return d.attributes.quantity.float
      }
    }
    return 0
  }, [data, sellToken])

  const handleConnectWallet = () => {
    if (!connectWallet) return
    setIsOpen(false)
    setIsConnectingWallet(true)
    connectWallet()
  }

  useEffect(() => {
    if (isConnectingWallet && !isConnecting) {
      setIsConnectingWallet(false)
      setIsOpen(true)
    }
  }, [isConnecting])

  const debouncedSellAmount = useDebounceValue(sellAmount, 500)

  const { data: swapQuote, isFetching: isSwapQuoteFetching } = useSwapQuote({
    chainId: sellToken.chainId,
    taker: address,
    buyToken: buyToken?.address ?? zeroAddress,
    sellToken: sellToken.address,
    sellAmount: debouncedSellAmount
      ? parseUnits(debouncedSellAmount, sellTokenData?.decimals ?? 18).toString()
      : undefined,
  })

  useEffect(() => {
    if (swapQuote?.liquidityAvailable) {
      setBuyAmount(
        Number.parseFloat(
          formatUnits(BigInt(swapQuote.buyAmount), buyTokenData?.decimals ?? 18)
        ).toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 6,
        })
      )
    }
  }, [swapQuote])

  const invertSwap = () => {
    setBuyToken(
      sellToken ?? {
        chainId: buyToken?.chainId ?? base.id,
        address: zeroAddress,
      }
    )
    setSellToken(
      buyToken ?? {
        chainId: sellToken?.chainId ?? base.id,
        address: zeroAddress,
      }
    )
    setSellAmount((buyAmount ?? '0').replace(/,/g, ''))
  }

  return (
    <SwapTokensContext.Provider
      value={{
        isOpen,
        setIsOpen,
        buyToken,
        buyTokenData,
        sellToken,
        sellTokenData,
        sellAmount,
        setSellAmount,
        buyAmount,
        setBuyAmount,
        swapQuote,
        isSwapQuoteFetching,
        connectWallet: handleConnectWallet,
        invertSwap,
        sellTokenMax,
      }}
    >
      {children}
    </SwapTokensContext.Provider>
  )
}

export function useSwapTokens() {
  const context = useContext(SwapTokensContext)
  if (!context) {
    throw new Error('useSwapTokens must be used within a SwapTokensProvider')
  }
  return context
}
