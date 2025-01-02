'use client'

import { Content } from '@/components/content'
import { AboutContent } from '@anonworld/react'
import { View } from '@anonworld/ui'

export default function AboutPage() {
  return (
    <Content>
      <View p="$2">
        <AboutContent />
      </View>
    </Content>
  )
}
