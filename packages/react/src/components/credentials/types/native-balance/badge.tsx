import { mainnet, NativeBalanceCredential } from '@anonworld/common'
import { formatAmount } from '@anonworld/common'
import { Badge } from '../../../badge'
import { formatUnits } from 'viem/utils'
import { Image } from '@anonworld/ui'

export function NativeBalanceBadge({
  credential,
}: { credential: NativeBalanceCredential }) {
  const amount = Number.parseFloat(formatUnits(BigInt(credential.metadata.balance), 18))

  return (
    <Badge
      icon={<Image src={mainnet.imageUrl} width={14} height={14} alt="ETH" br="$12" />}
    >{`${formatAmount(amount)}+ ETH`}</Badge>
  )
}
