import { HelpCircle } from '@tamagui/lucide-icons'

import { X } from '@tamagui/lucide-icons'
import { Adapt, Dialog, Sheet, View } from '@anonworld/ui'
import { AboutContent } from './content'
export * from './content'

export function About() {
  return (
    <Dialog modal>
      <Dialog.Trigger asChild>
        <View
          bg="$background"
          br="$12"
          hoverStyle={{ bg: '$color5' }}
          cursor="pointer"
          w={32}
          h={32}
          jc="center"
          ai="center"
        >
          <HelpCircle size={20} strokeWidth={2.5} />
        </View>
      </Dialog.Trigger>
      <Adapt when="sm">
        <Sheet animation="quicker" zIndex={200000} modal dismissOnSnapToBottom>
          <Sheet.Frame padding="$4" gap="$2">
            <Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay
            animation="quicker"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
        </Sheet>
      </Adapt>

      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quicker"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />

        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quicker',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          w={600}
        >
          <Dialog.Title display="none">About</Dialog.Title>
          <AboutContent />
          <Dialog.Close asChild>
            <View
              bg="$background"
              p="$2"
              br="$12"
              hoverStyle={{ bg: '$color5' }}
              cursor="pointer"
              position="absolute"
              top="$2"
              right="$2"
            >
              <X size={20} />
            </View>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
