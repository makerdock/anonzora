'use client'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ContractType,
  CREDENTIAL_EXPIRATION_TIME,
  CredentialType,
  StorageType,
  CredentialWithId,
  useCredentials,
  useSDK,
} from '@anonworld/react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { useEffect, useMemo, useState } from 'react'
import { Button } from './ui/button'
import { Loader2 } from 'lucide-react'
import { Slider } from './ui/slider'
import { useBalance } from '@/lib/hooks/use-balance'
import { formatEther, formatUnits, parseEther } from 'viem'
import { Input } from './ui/input'
import { timeAgo, TOKEN_ADDRESS } from '@/lib/utils'
import { useAccount } from 'wagmi'

export function CredentialsSelect({
  selected,
  onSelect,
}: {
  selected: CredentialWithId | null
  onSelect: (credential: CredentialWithId | null) => void
}) {
  const { credentials } = useCredentials()
  const [open, setOpen] = useState(false)

  const anonCredentials = useMemo(
    () =>
      credentials.filter(
        (credential) =>
          credential.metadata.tokenAddress === TOKEN_ADDRESS &&
          new Date(credential.verified_at).getTime() + CREDENTIAL_EXPIRATION_TIME >
            Date.now()
      ),
    [credentials]
  )

  useEffect(() => {
    onSelect(anonCredentials[0] ?? null)
  }, [])

  return (
    <>
      <Select
        value={selected?.id}
        onValueChange={(id) => {
          if (id === 'new') {
            setOpen(true)
          } else {
            onSelect(anonCredentials.find((credential) => credential.id === id) ?? null)
          }
        }}
        key={open ? 'open' : 'closed'}
      >
        <SelectTrigger className="resize-none bg-zinc-950 border border-zinc-700">
          <SelectValue placeholder="Select credential to use..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {anonCredentials.map((credential) => (
              <SelectItem key={credential.id} value={credential.id}>
                <div className="flex flex-row items-center gap-2">
                  <span className="font-semibold">
                    {`${credential.metadata?.balance ? Number.parseFloat(formatEther(BigInt(credential.metadata.balance))).toLocaleString() : 'Unknown'} ${
                      credential.metadata.tokenAddress === TOKEN_ADDRESS
                        ? 'ZORA'
                        : credential.metadata.tokenAddress
                    }`}
                  </span>
                  <span className="text-sm text-zinc-400">
                    {` • ${timeAgo(credential.verified_at.toString())}`}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
          {anonCredentials.length > 0 && <SelectSeparator />}
          <SelectGroup>
            <SelectItem value="new" className="font-semibold">
              Add new credential...
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <VerifyCredential
        open={open}
        setOpen={setOpen}
        onVerify={onSelect}
        minBalance={5}
      />
    </>
  )
}

export function VerifyCredential({
  open,
  setOpen,
  onVerify,
  minBalance,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  onVerify: (credential: CredentialWithId) => void
  minBalance: number
}) {
  const [isVerifying, setIsVerifying] = useState(false)
  const { data } = useBalance()
  const maxBalance = data ? Number.parseInt(formatUnits(data, 18)) : 0
  const [balance, setBalance] = useState(minBalance)
  const { add } = useCredentials()
  const [error, setError] = useState<string | null>(null)
  const { address } = useAccount()
  const { sdk } = useSDK()

  const handleVerify = async () => {
    setIsVerifying(true)
    try {
      if (!address) {
        throw new Error('No address connected')
      }

      const response = await sdk.getStorageSlot(
        8453,
        TOKEN_ADDRESS,
        ContractType.ERC20,
        StorageType.BALANCE
      )
      if (!response.data) {
        throw new Error('Failed to find balance storage slot')
      }

      const credential = await add(CredentialType.ERC20_BALANCE, {
        address,
        chainId: 8453,
        tokenAddress: TOKEN_ADDRESS,
        verifiedBalance: parseEther(balance.toString()),
        balanceSlot: response.data.slot,
      })
      onVerify(credential)
      setIsVerifying(false)
      setOpen(false)
    } catch (e) {
      setError((e as Error).message ?? 'Failed to verify credential')
      setIsVerifying(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="bg-black">
        <AlertDialogHeader>
          <AlertDialogTitle>Add $ZORA credential</AlertDialogTitle>
          <AlertDialogDescription>
            Credentials anonymously verify your onchain balance and add trusted tags to
            your posts. For now, we only support $ZORA - 5 ZORA to post.
            <br />
            <br />
            Important: While you can verify any balance amount, please note that higher
            balances may make it easier to identify you.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 mt-4">
          <Slider
            value={[balance]}
            onValueChange={([balance]) => setBalance(balance)}
            min={minBalance}
            max={maxBalance}
            step={5000}
          />
          <div className="flex flex-row items-center justify-between">
            <p className="text-sm text-zinc-400">{minBalance.toLocaleString()}</p>
            <p className="text-sm text-zinc-400">{maxBalance.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex flex-row gap-2 items-center mt-2">
          <span className="text-sm whitespace-nowrap">$ZORA</span>
          <Input
            className="w-32"
            value={balance.toString()}
            onChange={(e) => {
              const value = Number(e.target.value)
              if (!Number.isNaN(value)) {
                setBalance(value)
              }
            }}
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            disabled={balance < minBalance || balance > maxBalance || isVerifying}
            onClick={handleVerify}
          >
            {isVerifying ? (
              <div className="flex flex-row items-center gap-2">
                <Loader2 className="animate-spin" />
                <p>Verifying</p>
              </div>
            ) : (
              <p>Verify</p>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
