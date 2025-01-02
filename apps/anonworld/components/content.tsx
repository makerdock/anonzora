import { View } from '@anonworld/ui'

export function Content({
  children,
  gap = '$3',
}: { children: React.ReactNode; gap?: string }) {
  return (
    <View maxWidth={700} mx="auto" my="$3" gap={gap} minHeight="100vh">
      {children}
    </View>
  )
}
