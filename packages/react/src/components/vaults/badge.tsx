import { formatHexId, Vault } from '@anonworld/common'
import { Badge } from '../badge'
import { VaultAvatar } from './avatar'

export function VaultBadge({
  vaultId,
  vault,
}: {
  vaultId?: string | null
  vault?: Omit<Vault, 'credentials'>
}) {
  return (
    <Badge icon={<VaultAvatar vaultId={vaultId} imageUrl={vault?.image_url} />}>
      {vault?.username ?? (vaultId ? formatHexId(vaultId) : 'Anonymous')}
    </Badge>
  )
}
