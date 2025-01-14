import { Button, Popover, Text, View, XStack, YGroup } from '@anonworld/ui'
import { ChevronDown } from '@tamagui/lucide-icons'

const timeframes: Record<string, string> = {
  week: 'This Week',
  'last-week': 'Last Week',
  all: 'All Time',
}

export function LeaderboardSelector({
  selected,
  setSelected,
}: {
  selected: 'week' | 'last-week' | 'all-time'
  setSelected: (selected: 'week' | 'last-week' | 'all-time') => void
}) {
  return (
    <View ai="flex-end">
      <Popover size="$5" placement="bottom">
        <Popover.Trigger
          onPress={(e) => {
            e.stopPropagation()
          }}
          asChild
        >
          <Button size="$3" bg="$color1" br="$12" bw="$0">
            <XStack gap="$2" ai="center">
              <Text fos="$2" fow="400" color="$color11">
                {timeframes[selected]}
              </Text>
              <ChevronDown size={16} color="$color11" />
            </XStack>
          </Button>
        </Popover.Trigger>
        <Popover.Content
          enterStyle={{ y: -10, opacity: 0 }}
          exitStyle={{ y: -10, opacity: 0 }}
          elevate
          animation={[
            '100ms',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          padding="$0"
          cursor="pointer"
          bordered
          overflow="hidden"
        >
          <YGroup>
            <ActionButton label="Timeframe" fow="600" bbw="$0.5" />
            <ActionButton label={timeframes.week} onPress={() => setSelected('week')} />
            <ActionButton
              label={timeframes['last-week']}
              onPress={() => setSelected('last-week')}
            />
            <ActionButton
              label={timeframes.all}
              onPress={() => setSelected('all-time')}
            />
          </YGroup>
        </Popover.Content>
      </Popover>
    </View>
  )
}

function ActionButton({
  label,
  onPress,
  fow = '400',
  bbw = '$0',
}: {
  label: string
  onPress?: () => void
  fow?: '400' | '600'
  bbw?: '$0' | '$0.5'
}) {
  return (
    <YGroup.Item>
      <View
        onPress={onPress}
        fd="row"
        ai="center"
        gap="$2"
        px="$3.5"
        py="$2.5"
        hoverStyle={bbw === '$0' ? { bg: '$color5' } : {}}
        bbw={bbw}
        bc="$borderColor"
      >
        <Text fos="$2" fow={fow}>
          {label}
        </Text>
      </View>
    </YGroup.Item>
  )
}
