import { Image, Separator, Text, useToastController, XStack, YStack } from '@anonworld/ui'
import { Field } from '../../field'
import { formatAddress, formatAmount, mainnet } from '@anonworld/common'
import { Community, getChain } from '@anonworld/common'
import { Copy, WalletMinimal } from '@tamagui/lucide-icons'
import { useReadContract } from 'wagmi'
import { erc20Abi, formatUnits } from 'viem'
import { Link } from 'solito/link'

export function CommunityWallet({ community }: { community: Community }) {
  const chain = getChain(Number(community.token.chain_id))
  const toast = useToastController()

  return (
    <YStack gap="$4" mt="$2" $xs={{ gap: '$2' }}>
      <XStack gap="$4" ai="center">
        <XStack ai="center" gap="$2">
          <WalletMinimal size={12} color="$color11" />
          <Text fos="$1" fow="400" color="$color11" textTransform="uppercase">
            Wallet
          </Text>
        </XStack>
        <Separator />
      </XStack>
      <XStack ai="center" jc="space-between">
        <YStack gap="$1" minWidth="$12">
          <Link
            href={`https://basescan.org/address/${community.wallet_address}`}
            target="_blank"
          >
            <Text fow="600">{formatAddress(community.wallet_address)}</Text>
          </Link>
          <XStack
            gap="$1.5"
            onPress={() => {
              navigator.clipboard.writeText(community.token.address)
              toast.show('Copied token address')
            }}
            cursor="pointer"
            group
            ai="center"
          >
            <Copy size={10} color="$color11" $group-hover={{ color: '$color12' }} />
            <Text
              fos="$1"
              fow="400"
              color="$color11"
              textTransform="uppercase"
              $group-hover={{ color: '$color12' }}
            >
              {formatAddress(community.wallet_address)}
            </Text>
            <Image
              src={chain.imageUrl}
              width={10}
              height={10}
              br="$12"
              alt={chain.name}
            />
          </XStack>
        </YStack>
        <XStack
          gap="$4"
          ai="center"
          jc="flex-end"
          px="$4"
          fg={1}
          $xs={{ flexDirection: 'column', gap: '$2', px: '$2', ai: 'flex-end' }}
        >
          <Balance
            contractAddress={community.token.address}
            chainId={community.token.chain_id}
            walletAddress={community.wallet_address}
            decimals={community.token.decimals}
            label={community.token.symbol}
            image={community.token.image_url ?? ''}
          />
          <Balance
            contractAddress={'0x4200000000000000000000000000000000000006'}
            chainId={community.token.chain_id}
            walletAddress={community.wallet_address}
            decimals={18}
            label="ETH"
            image={mainnet.imageUrl}
          />
        </XStack>
      </XStack>
    </YStack>
  )
}

function Balance({
  contractAddress,
  chainId,
  walletAddress,
  decimals,
  label,
  image,
}: {
  contractAddress: string
  chainId: number
  walletAddress: string
  decimals: number
  label: string
  image: string
}) {
  const { data, isLoading } = useReadContract({
    chainId,
    address: contractAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [walletAddress as `0x${string}`],
  })

  if (!data) return null

  return (
    <Field
      image={image}
      label={label}
      value={formatAmount(Number.parseFloat(formatUnits(data, decimals)))}
      minWidth="$10"
      ai="flex-end"
    />
  )
}
