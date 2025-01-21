import { Image, Separator, Text, useToastController, XStack, YStack } from '@anonworld/ui'
import { Field } from '../../field'
import { formatAddress, formatAmount, mainnet } from '@anonworld/common'
import { Community, getChain } from '@anonworld/common'
import { Copy, WalletMinimal } from '@tamagui/lucide-icons'
import { Link } from 'solito/link'
import { getBalances } from '../utils'

export function CommunityWallet({ community }: { community: Community }) {
  const chain = getChain(Number(community.token.chain_id))
  const toast = useToastController()
  const { weth, token } = getBalances(community)

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
          <Field
            image={community.token.image_url ?? ''}
            label={community.token.symbol}
            value={formatAmount(token)}
            minWidth="$10"
            ai="flex-end"
          />
          <Field
            image={mainnet.imageUrl}
            label="ETH"
            value={formatAmount(weth)}
            minWidth="$10"
            ai="flex-end"
          />
        </XStack>
      </XStack>
    </YStack>
  )
}
