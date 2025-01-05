import { Button, Spinner, Text, XStack, YStack } from '@anonworld/ui'
import { useAccount } from 'wagmi'
import { useNewCredential } from '../../context'

export function SubmitButton() {
  const { address } = useAccount()
  const { handleAddCredential, balance, isLoading, error } = useNewCredential()

  return (
    <YStack mt="$4" gap="$2">
      {error && (
        <Text color="$red11" fos="$1" textAlign="center" mt="$-2">
          {error}
        </Text>
      )}
      {isLoading && (
        <Text color="$color11" fos="$1" textAlign="center" mt="$-2">
          Please wait. This may take a few seconds.
        </Text>
      )}
      <Button
        bg="$color12"
        br="$4"
        disabled={!address || isLoading || balance === 0}
        disabledStyle={{ opacity: 0.5, bg: '$color12' }}
        hoverStyle={{ opacity: 0.9, bg: '$color12' }}
        pressStyle={{ opacity: 0.9, bg: '$color12' }}
        onPress={handleAddCredential}
      >
        {!isLoading ? (
          <Text fos="$3" fow="600" color="$color1">
            {address ? 'Add Credential' : 'Connect Wallet'}
          </Text>
        ) : (
          <XStack gap="$2" alignItems="center">
            <Spinner color="$color1" />
            <Text fos="$2" fow="600" color="$color1">
              Adding Credential
            </Text>
          </XStack>
        )}
      </Button>
    </YStack>
  )
}
