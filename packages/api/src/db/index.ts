import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env from packages directory or root
config({ path: resolve(__dirname, '../../.env') })
config({ path: resolve(__dirname, '../../../../.env') })

import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import { PostsRepository } from './repositories/posts'
import { VaultsRepository } from './repositories/vaults'
import { CredentialsRepository } from './repositories/credentials'
import { CommunitiesRepository } from './repositories/communities'
import { PasskeysRepository } from './repositories/passkeys'
import { SocialsRepository } from './repositories/socials'
import { TokensRepository } from './repositories/tokens'
import { RelationshipsRepository } from './repositories/relationships'
import { ActionsRepository } from './repositories/actions'

export class Repositories {
  public db: ReturnType<typeof drizzle>
  private client: Client

  public posts: PostsRepository
  public vaults: VaultsRepository
  public credentials: CredentialsRepository
  public communities: CommunitiesRepository
  public passkeys: PasskeysRepository
  public socials: SocialsRepository
  public tokens: TokensRepository
  public relationships: RelationshipsRepository
  public actions: ActionsRepository

  constructor() {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    
    // Create and connect PostgreSQL client
    this.client = new Client({
      connectionString: databaseUrl,
    })
    
    this.client.connect().catch(err => {
      console.error('Failed to connect to database:', err)
      throw err
    })
    
    // Initialize Drizzle with the connected client
    this.db = drizzle(this.client)
    
    this.posts = new PostsRepository(this.db)
    this.vaults = new VaultsRepository(this.db)
    this.credentials = new CredentialsRepository(this.db)
    this.communities = new CommunitiesRepository(this.db)
    this.passkeys = new PasskeysRepository(this.db)
    this.socials = new SocialsRepository(this.db)
    this.tokens = new TokensRepository(this.db)
    this.relationships = new RelationshipsRepository(this.db)
    this.actions = new ActionsRepository(this.db)
  }
}

export const db = new Repositories()
