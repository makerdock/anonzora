import {
  ActionType,
  Community,
  CredentialType,
  ERC20CredentialRequirement,
  validateCredentialRequirements,
} from '@anonworld/common'
import { useCredentials } from '../../../providers'
import { getUsableCredential } from '@anonworld/common'
import { NewPostProvider } from '../../posts/new/context'
import { NewPostDialog } from '../../posts/new/dialog'
import { NewPostButton } from '../../posts/new'
import { NewCredential } from '../../credentials'
import { useCommunityActions } from '../../../hooks/use-community-actions'
import { formatUnits } from 'viem'

export function NewPost() {
  return (
    <NewPostProvider>
      <NewPostDialog>
        <NewPostButton />
      </NewPostDialog>
    </NewPostProvider>
  )
}

export function NewCommunityPost({
  community,
}: {
  community: Community
}) {
  const { data: actions } = useCommunityActions(community.id)
  const { credentials } = useCredentials()
  const action = actions?.find((action) => {
    if (
      action.type === ActionType.COPY_POST_FARCASTER &&
      action.metadata.fid === community.fid
    ) {
      return action
    }

    return null
  })

  if (!action) return null

  const credential = getUsableCredential(credentials, action)
  let validCredentials = credential ? [credential] : []
  let missingCredentials = !credential
    ? [{ type: action.credential_id?.split(':')[0], data: action.credential_requirement }]
    : []

  if (action.credentials) {
    validCredentials = []
    missingCredentials = []

    for (const cred of action.credentials) {
      const usableCredential = validateCredentialRequirements(credentials, cred)
      if (usableCredential) {
        validCredentials.push(usableCredential)
      } else {
        missingCredentials.push(cred)
      }
    }
  }

  if (missingCredentials.length > 0) {
    const cred = missingCredentials[0]
    let initialBalance = 0
    if (cred.data && 'minimumBalance' in cred.data) {
      let decimals = cred.type === CredentialType.ERC20_BALANCE ? 18 : 0
      if (cred.data.tokenAddress === community.token.address) {
        decimals = community.token.decimals
      }
      initialBalance = Number.parseInt(
        formatUnits(BigInt(cred.data.minimumBalance), decimals).toString()
      )
    }
    return (
      <NewCredential
        initialTokenId={{
          chainId: community.token.chain_id,
          address: community.token.address,
        }}
        initialBalance={initialBalance}
      />
    )
  }

  return (
    <NewPostProvider initialCredentials={validCredentials}>
      <NewPostDialog>
        <NewPostButton />
      </NewPostDialog>
    </NewPostProvider>
  )
}
