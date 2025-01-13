import { Button, Spinner, Text, XStack } from '@anonworld/ui'
import { Plus } from '@tamagui/lucide-icons'
import { useMutation } from '@tanstack/react-query'
import { useCredentials } from '../../../providers'

export function NewVault() {
  const { addVault } = useCredentials()
  const { mutate, isPending } = useMutation({
    mutationFn: async () => await addVault(),
  })

  return (
    <Button
      size="$3"
      bg="$color6"
      br="$12"
      bw="$0"
      disabledStyle={{ opacity: 0.5, bg: '$color6' }}
      hoverStyle={{ opacity: 0.9, bg: '$color6' }}
      pressStyle={{ opacity: 0.9, bg: '$color6' }}
      onPress={() => mutate()}
      disabled={isPending}
    >
      <XStack ai="center" gap="$2" opacity={0.9}>
        {isPending ? (
          <Spinner color="$color12" />
        ) : (
          <Plus size={16} strokeWidth={2.5} color="$color12" />
        )}
        <Text fos="$2" fow="500" color="$color12">
          {isPending ? 'Creating...' : 'New Profile'}
        </Text>
      </XStack>
    </Button>
  )
}
