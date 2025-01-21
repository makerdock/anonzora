import { Image, Separator, Text, useToastController, XStack, YStack } from '@anonworld/ui'
import { Field } from '../../field'
import {
  ContractType,
  CredentialRequirement,
  CredentialType,
  ERC20CredentialRequirement,
  ERC721CredentialRequirement,
  formatAddress,
  formatAmount,
  NativeCredentialRequirement,
  Token,
  validateCredentialRequirements,
} from '@anonworld/common'
import { formatUnits, zeroAddress } from 'viem'
import { ActionType, Community, getChain } from '@anonworld/common'
import { useCredentials } from '../../../providers'
import { getUsableCredential } from '@anonworld/common'
import { CircleCheck, CircleX, Coins, Copy } from '@tamagui/lucide-icons'
import { TokenImage } from '../../tokens/image'
import { Link } from 'solito/link'
import { useCommunityActions } from '../../../hooks/use-community-actions'
import { useToken } from '../../../hooks/use-token'

export function CommunityToken({ community }: { community: Community }) {
  const chain = getChain(Number(community.token.chain_id))
  const toast = useToastController()

  return (
    <YStack gap="$4" mt="$2" $xs={{ gap: '$2' }}>
      <XStack gap="$4" ai="center">
        <XStack ai="center" gap="$2">
          <Coins size={12} color="$color11" />
          <Text fos="$1" fow="400" color="$color11" textTransform="uppercase">
            Token
          </Text>
        </XStack>
        <Separator />
      </XStack>
      <XStack ai="center" jc="space-between">
        <YStack gap="$1" minWidth="$12">
          <Link
            href={
              community.token.address === zeroAddress
                ? '#'
                : community.token.type === ContractType.ERC721
                  ? `https://opensea.io/assets/${chain.name.toLowerCase()}/${community.token.address}`
                  : `https://dexscreener.com/${chain.name.toLowerCase()}/${community.token.address}`
            }
            target={community.token.address === zeroAddress ? undefined : '_blank'}
          >
            <XStack ai="center" gap="$2">
              <TokenImage token={community.token} />
              <Text fow="600">{community.token.symbol}</Text>
            </XStack>
          </Link>
          <XStack
            gap="$1.5"
            onPress={() => {
              navigator.clipboard.writeText(community.token.address)
              toast.show('Copied token address')
            }}
            cursor="pointer"
            group
            ai="center"
          >
            <Copy size={10} color="$color11" $group-hover={{ color: '$color12' }} />
            <Text
              fos="$1"
              fow="400"
              color="$color11"
              textTransform="uppercase"
              $group-hover={{ color: '$color12' }}
            >
              {formatAddress(community.token.address)}
            </Text>
            <Image
              src={chain.imageUrl}
              width={10}
              height={10}
              br="$12"
              alt={chain.name}
            />
          </XStack>
        </YStack>
        <XStack
          gap="$4"
          ai="center"
          jc="flex-end"
          px="$4"
          fg={1}
          $xs={{ flexDirection: 'column', gap: '$2', px: '$2', ai: 'flex-end' }}
        >
          <Field
            label="Mkt Cap"
            value={`$${formatAmount(community.token.market_cap)}`}
            minWidth="$8"
            ai="flex-end"
          />
          <Field
            label="Price"
            value={`$${formatAmount(Number(community.token.price_usd))}`}
            minWidth="$8"
            ai="flex-end"
          />
          <Field
            label="Supply"
            value={formatAmount(community.token.total_supply || 100000000000)}
            minWidth="$8"
            ai="flex-end"
          />
          {community.token.holders > 0 && (
            <Field
              label="Holders"
              value={formatAmount(community.token.holders)}
              minWidth="$8"
              ai="flex-end"
            />
          )}
        </XStack>
      </XStack>
      <CommunityActions community={community} />
    </YStack>
  )
}

const formatRequirement = (req: CredentialRequirement | null, token?: Token) => {
  if (req && 'minimumBalance' in req) {
    return {
      value: Number.parseFloat(
        formatUnits(BigInt(req.minimumBalance), token?.decimals ?? 18)
      ),
      label: token?.symbol,
    }
  }
  return null
}

export function CommunityActions({ community }: { community: Community }) {
  const { data: actions } = useCommunityActions(community.id)
  const { credentials } = useCredentials()

  if (actions && actions.length === 0) {
    return null
  }

  return (
    <YStack gap="$2.5" theme="surface3" themeShallow br="$4" mt="$2">
      {actions
        ?.sort((a, b) => {
          let reqA = formatRequirement(a.credential_requirement, a.community?.token)
          let reqB = formatRequirement(b.credential_requirement, b.community?.token)
          return (reqA?.value ?? 0) - (reqB?.value ?? 0)
        })
        .map((action, i) => {
          let label = ''
          switch (action.type) {
            case ActionType.COPY_POST_TWITTER:
              label = 'Post to Twitter'
              break
            case ActionType.COPY_POST_FARCASTER:
              label = 'Post to Farcaster'
              break
            case ActionType.DELETE_POST_TWITTER:
              label = 'Delete from Twitter'
              break
            case ActionType.DELETE_POST_FARCASTER:
              label = 'Delete from Farcaster'
              break
          }

          let reqs = []
          switch (action.credential_id?.split(':')[0] as CredentialType) {
            case CredentialType.ERC20_BALANCE:
              reqs.push(
                <ERC20Label
                  req={action.credential_requirement as ERC20CredentialRequirement}
                />
              )
              break
            case CredentialType.ERC721_BALANCE:
              reqs.push(
                <ERC721Label
                  req={action.credential_requirement as ERC721CredentialRequirement}
                />
              )
              break
            case CredentialType.NATIVE_BALANCE:
              reqs.push(
                <NativeLabel
                  req={action.credential_requirement as NativeCredentialRequirement}
                />
              )
              break
          }

          let isValidCredentials = [!!getUsableCredential(credentials, action)]

          if (action.credentials) {
            reqs = action.credentials.map((cred) => {
              switch (cred.type) {
                case CredentialType.ERC20_BALANCE:
                  return <ERC20Label req={cred.data as ERC20CredentialRequirement} />
                case CredentialType.ERC721_BALANCE:
                  return <ERC721Label req={cred.data as ERC721CredentialRequirement} />
                case CredentialType.NATIVE_BALANCE:
                  return <NativeLabel req={cred.data as NativeCredentialRequirement} />
              }
            })
            isValidCredentials = action.credentials.map(
              (cred) => !!validateCredentialRequirements(credentials, cred)
            )
          }

          return (
            <XStack key={i} gap="$2" ai="center">
              <XStack
                gap="$2"
                ai="center"
                $xs={{ flexDirection: 'column', ai: 'flex-start' }}
              >
                <Text fos="$2" fow="400">
                  {label}:
                </Text>
                <XStack gap="$2.5">
                  {reqs.map((r, i) => (
                    <XStack gap="$1.5" ai="center" key={i}>
                      {isValidCredentials[i] ? (
                        <CircleCheck size={16} color="$green11" />
                      ) : (
                        <CircleX size={16} color="$red11" />
                      )}
                      <Text fow="500" fos="$2">
                        {r}
                      </Text>
                    </XStack>
                  ))}
                </XStack>
              </XStack>
            </XStack>
          )
        })}
    </YStack>
  )
}

function NativeLabel({ req }: { req: NativeCredentialRequirement }) {
  return <>{`${formatUnits(BigInt(req.minimumBalance), 18).toLocaleString()} ETH`}</>
}

function ERC20Label({ req }: { req: ERC20CredentialRequirement }) {
  const { data: token } = useToken({ chainId: req.chainId, address: req.tokenAddress })
  return (
    <>{`${formatUnits(BigInt(req.minimumBalance), token?.decimals ?? 18).toLocaleString()} ${token?.symbol || ''}`}</>
  )
}

function ERC721Label({ req }: { req: ERC721CredentialRequirement }) {
  const { data: token } = useToken({ chainId: req.chainId, address: req.tokenAddress })
  return <>{`${req?.minimumBalance?.toLocaleString()} ${token?.name || ''}`}</>
}
