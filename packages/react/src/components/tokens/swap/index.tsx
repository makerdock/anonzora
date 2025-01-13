import { Text, XStack, Button, Dialog } from '@anonworld/ui'
import { SwapTokensProvider } from './context'
import { SwapTokensDialog } from './dialog'
import { ArrowLeftRight } from '@tamagui/lucide-icons'

export function SwapTokens({
  initialBuyToken,
  initialSellToken,
}: {
  initialBuyToken?: { chainId: number; address: string }
  initialSellToken?: { chainId: number; address: string }
}) {
  return (
    <SwapTokensProvider
      initialBuyToken={initialBuyToken}
      initialSellToken={initialSellToken}
    >
      <SwapTokensDialog>
        <Dialog.Trigger asChild>
          <Button
            size="$3"
            bg="$color6"
            br="$12"
            bw="$0"
            disabledStyle={{ opacity: 0.5, bg: '$color6' }}
            hoverStyle={{ opacity: 0.9, bg: '$color6' }}
            pressStyle={{ opacity: 0.9, bg: '$color6' }}
          >
            <XStack ai="center" gap="$2" opacity={0.9}>
              <ArrowLeftRight size={16} strokeWidth={2} color="$color12" />
              <Text fos="$2" fow="500" color="$color12">
                Swap
              </Text>
            </XStack>
          </Button>
        </Dialog.Trigger>
      </SwapTokensDialog>
    </SwapTokensProvider>
  )
}
