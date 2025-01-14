'use client'

import { Content } from '@/components/content'
import { Leaderboard, LeaderboardSelector } from '@anonworld/react'
import { Text, View, XStack, YStack } from '@anonworld/ui'
import { useEffect, useState } from 'react'

export default function LeaderboardPage() {
  const [selected, setSelected] = useState<'week' | 'last-week' | 'all-time'>('week')

  return (
    <Content>
      <XStack ai="center" jc="space-between" $xs={{ px: '$2' }}>
        <YStack ai="flex-start" gap="$1">
          <XStack ai="center" jc="center" gap="$2">
            <Text fow="600" fos="$4">
              Leaderboard
            </Text>
            <View bg="$green9" px="$1.5" py="$1" br="$2">
              <Text fos="$1" fow="600" color="$green12">
                BETA
              </Text>
            </View>
          </XStack>
          <ResetCountdown />
        </YStack>
        <LeaderboardSelector selected={selected} setSelected={setSelected} />
      </XStack>
      <Leaderboard />
    </Content>
  )
}

function getNextTuesday16UTC() {
  const now = new Date()
  const nextTuesday = new Date()
  nextTuesday.setUTCHours(16, 0, 0, 0)

  // Adjust to next Tuesday
  while (nextTuesday.getUTCDay() !== 2 || nextTuesday < now) {
    nextTuesday.setDate(nextTuesday.getDate() + 1)
  }

  return nextTuesday
}

function ResetCountdown() {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    function updateCountdown() {
      const now = new Date()
      const target = getNextTuesday16UTC()
      const diff = target.getTime() - now.getTime()

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      const timeString = [
        days > 0 ? `${days}d` : '',
        `${hours}h`,
        `${minutes}m`,
        `${seconds}s`,
      ]
        .filter(Boolean)
        .join(' ')

      setTimeLeft(timeString)
    }

    // Update immediately
    updateCountdown()

    // Update every second
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Text fos="$2" fow="400" color="$color11">
      Resets in {timeLeft}
    </Text>
  )
}
