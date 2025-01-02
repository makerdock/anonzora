import { TextLink } from 'solito/link'
import { AnonWorld } from '../svg/anonworld'
import { Text, XStack, YStack } from '@anonworld/ui'

export function AboutContent() {
  return (
    <YStack gap="$4">
      <XStack gap="$2" ai="center" $xs={{ display: 'none' }}>
        <AnonWorld size={44} />
        <YStack>
          <Text fow="600" fos="$4">
            ANON.WORLD
          </Text>
          <Text color="$color11" fos="$1">
            An anonymous social network
          </Text>
        </YStack>
      </XStack>
      <YStack gap="$2">
        <Text fos="$2" fow="400" col="$color11">
          What is anon.world?
        </Text>
        <Text>
          An anonymous social network for browsing and creating anonymous posts with
          verified credentials.
        </Text>
      </YStack>
      <YStack gap="$2">
        <Text fos="$2" fow="400" col="$color11">
          How does it work?
        </Text>
        <Text>
          We use zero-knowledge (zk) proofs to generate anonymous credentials. These
          credentials are stored locally in your browser. When you create a post, you can
          attach as many credentials as you'd like to your post.
        </Text>
      </YStack>
      <YStack gap="$2">
        <Text fos="$2" fow="400" col="$color11">
          What are communities?
        </Text>
        <Text>
          Communities are groups of users with shared credentials. Every community is
          backed by a token, a shared Farcaster account, and a shared wallet. Members of a
          community can take anonymous actions on behalf of the community, such as posting
          to Farcaster and X/Twitter.
        </Text>
      </YStack>
      <YStack gap="$2">
        <Text fos="$2" fow="400" col="$color11">
          Support
        </Text>
        <Text>
          If you run into any issues or have questions, DM @slokh on{' '}
          <TextLink href="https://warpcast.com/slokh" target="_blank" rel="noreferrer">
            <Text fos="$3" textDecorationLine="underline" col="$color11">
              Farcaster
            </Text>
          </TextLink>{' '}
          or{' '}
          <TextLink href="https://twitter.com/slokh" target="_blank" rel="noreferrer">
            <Text fos="$3" textDecorationLine="underline" col="$color11">
              Twitter
            </Text>
          </TextLink>
          .
        </Text>
      </YStack>
    </YStack>
  )
}
