import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { CredentialType, Vault } from '@anonworld/common'
import { useCredentials, useSDK } from '../../../../../providers'
import { formatUnits, parseUnits } from 'viem'
import { useAccount, useBalance } from 'wagmi'

interface NewNativeBalanceCredentialContextValue {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  connectWallet: () => void
  isConnecting: boolean
  tokenId: { chainId: number; address: string } | undefined
  setTokenId: (token?: { chainId: number; address: string }) => void
  balance: string
  setBalance: (balance: string) => void
  handleAddCredential: () => void
  isLoading: boolean
  error: string | undefined
  parentId?: string
  maxBalance: number
}

const NewNativeBalanceCredentialContext =
  createContext<NewNativeBalanceCredentialContextValue | null>(null)

export function NewNativeBalanceCredentialProvider({
  children,
  initialBalance,
  isOpen,
  setIsOpen,
  parentId,
  vault,
}: {
  children: React.ReactNode
  initialBalance?: number
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  parentId?: string
  vault?: Vault
}) {
  const { connectWallet, isConnecting } = useSDK()
  const [isConnectingWallet, setIsConnectingWallet] = useState(false)
  const [tokenId, setTokenId] = useState<
    { chainId: number; address: string } | undefined
  >()
  const [balance, setBalance] = useState<string>(initialBalance?.toString() ?? '0')
  const { address } = useAccount()
  const { add, addToVault } = useCredentials()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const { data: maxBalanceRaw } = useBalance({
    chainId: tokenId?.chainId,
    address: address as `0x${string}`,
  })

  const maxBalance = useMemo(() => {
    if (!maxBalanceRaw) return 0
    return Number(formatUnits(maxBalanceRaw.value, maxBalanceRaw.decimals))
  }, [maxBalanceRaw])

  useEffect(() => {
    if (maxBalance) {
      if (initialBalance) {
        setBalance(Math.min(maxBalance, initialBalance).toString())
      } else {
        setBalance(maxBalance.toString())
      }
    }
  }, [maxBalance])

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

  useEffect(() => {
    if (isOpen) {
      if (initialBalance) {
        setBalance(initialBalance.toString())
      }
    }
  }, [isOpen, initialBalance])

  const handleAddCredential = async () => {
    if (!tokenId) return
    try {
      setIsLoading(true)

      if (!address) {
        throw new Error('No address connected')
      }

      const credential = await add(
        CredentialType.NATIVE_BALANCE,
        {
          address,
          chainId: tokenId.chainId,
          verifiedBalance: parseUnits(balance, 18),
        },
        parentId
      )

      if (vault) {
        await addToVault(vault, credential)
      }

      setIsLoading(false)
      setIsOpen(false)
    } catch (e) {
      setError((e as Error).message ?? 'Failed to add credential')
      setIsLoading(false)
    }
  }

  return (
    <NewNativeBalanceCredentialContext.Provider
      value={{
        isOpen,
        setIsOpen,
        connectWallet: handleConnectWallet,
        isConnecting: isConnectingWallet,
        tokenId,
        setTokenId,
        balance,
        setBalance,
        handleAddCredential,
        isLoading,
        error,
        parentId,
        maxBalance: maxBalance,
      }}
    >
      {children}
    </NewNativeBalanceCredentialContext.Provider>
  )
}

export function useNewNativeBalanceCredential() {
  const context = useContext(NewNativeBalanceCredentialContext)
  if (!context) {
    throw new Error(
      'useNewNativeBalanceCredential must be used within a NewNativeBalanceCredentialProvider'
    )
  }
  return context
}
