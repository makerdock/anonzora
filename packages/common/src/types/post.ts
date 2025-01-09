import { Community } from './community'
import { Credential } from './credentials'
import { FarcasterCast, FarcasterUser } from './farcaster'
import { TwitterUser } from './twitter'
import { Token } from './token'
import { Vault } from './vaults'

export type Post = FarcasterCast & {
  reveal?: Reveal
  relationships: Array<Relationship>
  credentials: Array<Credential & { token?: Token; vault?: Vault }>
  aggregate: {
    likes: number
    replies: number
  }
  user?: {
    liked: boolean
  }
  parentText?: string
}

export type Reveal = {
  revealHash: string
  input: string
  phrase?: string
  signature?: string
  address?: string
  revealedAt: string
}

export type Relationship = {
  target: string
  targetAccount: string
  targetId: string
  farcaster?: FarcasterUser
  twitter?: TwitterUser
  community?: Community
}

export type ConversationPost = Post & {
  direct_replies: Array<ConversationPost>
}

export type RevealArgs = {
  hash: string
  message: string
  phrase: string
  signature: string
  address: string
}

export type PostData = {
  text: string | null
  reply: string | null
  links: string[]
  images: string[]
}
