import { Action } from '@anonworld/common'
import { NativeCredentialRequirement } from '@anonworld/common'
import { Text } from '@anonworld/ui'
import { formatAmount } from '@anonworld/common'
import { formatUnits } from 'viem/utils'

export function NativeBalanceRequirement({
  action,
  req,
}: {
  action: Action
  req: NativeCredentialRequirement
}) {
  const amount = Number.parseFloat(
    formatUnits(BigInt(req.minimumBalance), action.community?.token.decimals ?? 18)
  )

  return (
    <Text fos="$1" fow="500" color="$color10">
      {`req: ${formatAmount(amount)} ETH`}
    </Text>
  )
}
