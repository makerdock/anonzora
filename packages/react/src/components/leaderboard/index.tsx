import { YStack, XStack, Text, Spinner } from '@anonworld/ui'
import { PostCredential } from '../posts/display/credential'
import { useLeaderboard } from '../../hooks/use-leaderboard'
import { VaultBadge } from '../vaults'
import { Link } from 'solito/link'

export function Leaderboard() {
  const { data, isLoading } = useLeaderboard()

  if (isLoading) {
    return <Spinner color="$color12" />
  }

  return (
    <YStack gap="$4" $xs={{ gap: '$0', bbw: '$0.5', bc: '$borderColor' }}>
      {data?.map(({ credential, score, posts }, i) => (
        <Link key={credential.hash} href={`/credentials/${credential.hash}`}>
          <XStack
            jc="space-between"
            theme="surface1"
            themeShallow
            bg="$background"
            bc="$borderColor"
            bw="$0.5"
            p="$3"
            gap="$4"
            br="$4"
            $xs={{
              br: '$0',
              bw: '$0',
              btw: '$0.5',
            }}
            fs={1}
          >
            <XStack gap="$3" ai="center">
              <Text fos="$2" fow="600">
                {i + 1}
              </Text>
              <VaultBadge
                vaultId={credential.vault_id}
                vault={credential.vault ?? undefined}
              />
              <PostCredential credential={credential} />
            </XStack>
            <YStack ai="flex-end">
              <Text fos="$2" fow="600">
                {score}
              </Text>
              <Text fos="$1" color="$color11">{`${posts} posts`}</Text>
            </YStack>
          </XStack>
        </Link>
      ))}
    </YStack>
  )
}
