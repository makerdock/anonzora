import { mainnet, NativeBalanceCredential } from '@anonworld/common'
import { formatUnits } from 'viem/utils'
import { Text, XStack, Image } from '@anonworld/ui'

export function NativeBalanceSelect({
  credential,
}: { credential: NativeBalanceCredential }) {
  const amount = Number.parseFloat(formatUnits(BigInt(credential.metadata.balance), 18))

  return (
    <XStack gap="$2" ai="center" jc="space-between" f={1}>
      <Image src={mainnet.imageUrl} width={14} height={14} alt="ETH" br="$12" />
      <Text fos="$2" fow="500">
        {`${amount.toLocaleString()} ETH`}
      </Text>
    </XStack>
  )
}
