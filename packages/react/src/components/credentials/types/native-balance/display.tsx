import { NativeBalanceCredential, getChain, mainnet } from '@anonworld/common'
import { XStack } from '@anonworld/ui'
import { formatUnits } from 'viem/utils'
import { Field } from '../../../field'

export function NativeBalanceDisplay({
  credential,
}: { credential: NativeBalanceCredential }) {
  const amount = Number.parseFloat(formatUnits(BigInt(credential.metadata.balance), 18))
  const chain = getChain(Number(credential.metadata.chainId))

  return (
    <XStack gap="$4" $xs={{ flexDirection: 'column', gap: '$2', ai: 'flex-start' }}>
      {[
        {
          label: 'Token',
          value: 'ETH',
          image: mainnet.imageUrl,
        },
        {
          label: 'Chain',
          value: chain.name,
          image: chain.imageUrl,
        },
        { label: 'Balance', value: amount.toLocaleString() },
      ].map(({ label, value, image }) => (
        <Field key={label} label={label} value={value} image={image} />
      ))}
    </XStack>
  )
}
