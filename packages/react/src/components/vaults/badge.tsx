import { formatHexId } from '@anonworld/common'
import { Badge } from '../badge'
import { VaultAvatar } from './avatar'

export function VaultBadge({
  vaultId,
  vault,
}: {
  vaultId?: string | null
  vault?: { id: string; username: string | null; image_url: string | null }
}) {
  return (
    <Badge icon={<VaultAvatar vaultId={vaultId} imageUrl={vault?.image_url} />}>
      {vault?.username ?? (vaultId ? formatHexId(vaultId) : 'No Profile')}
    </Badge>
  )
}
