import { Credential, CredentialWithId, getCredential } from '@anonworld/common'
import { View, XStack, YStack } from '@anonworld/ui'
import { CREDENTIAL_EXPIRATION_TIME, timeAgo } from '@anonworld/common'
import { Badge } from '../../badge'
import { CredentialActions } from './actions'
import { CredentialTypeDisplay } from '../types'

export function CredentialDisplay({
  credential,
  onPress,
}: { credential: Credential; onPress?: () => void }) {
  const isExpired =
    credential.verified_at &&
    new Date(credential.verified_at).getTime() + CREDENTIAL_EXPIRATION_TIME < Date.now()
  return (
    <YStack
      theme="surface1"
      themeShallow
      gap="$4"
      onPress={onPress}
      hoverStyle={onPress ? { bg: '$color3' } : {}}
      cursor={onPress ? 'pointer' : undefined}
      fs={1}
    >
      <XStack ai="center" gap="$2">
        <Badge>{getCredential(credential.type)?.name}</Badge>
        <Badge>{timeAgo(credential.verified_at.toString())}</Badge>
        {isExpired && <Badge destructive>Expired</Badge>}
      </XStack>
      <View px="$1">
        <CredentialTypeDisplay credential={credential} />
      </View>
      {credential.id && (
        <View position="absolute" top="$-2" right="$-2">
          <CredentialActions credential={credential as CredentialWithId} />
        </View>
      )}
    </YStack>
  )
}
