import { formatHexId, toHslColors, Vault } from '@anonworld/common'
import { LinearGradient } from '@tamagui/linear-gradient'
import { Image } from '@anonworld/ui'

export function VaultAvatar({
  vaultId,
  size = 16,
  imageUrl,
}: { vaultId?: string | null; size?: number | string; imageUrl?: string | null }) {
  if (!vaultId) {
    return (
      <LinearGradient
        width={16}
        height={16}
        borderRadius="$12"
        colors={['$color10', '$color12']}
        start={[1, 1]}
        end={[0, 0]}
      />
    )
  }

  const id = formatHexId(vaultId)
  const { background, secondary } = toHslColors(id)

  if (imageUrl) {
    return <Image src={imageUrl} width={size} height={size} borderRadius="$12" />
  }

  return (
    <LinearGradient
      width={size}
      height={size}
      borderRadius="$12"
      colors={[secondary, background]}
      start={[1, 1]}
      end={[0, 0]}
    />
  )
}
