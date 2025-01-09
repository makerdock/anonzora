import { CredentialWithId } from './credentials'

export type Vault = {
  id: string
  created_at: string
  image_url: string | null
  username: string | null
  posts: number
  credentials: Array<CredentialWithId>
}
