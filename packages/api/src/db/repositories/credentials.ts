import { drizzle } from 'drizzle-orm/node-postgres'
import { credentialsTable } from '../schema'
import { DBCredential } from '../types'
import { eq, inArray } from 'drizzle-orm'

export class CredentialsRepository {
  private db: ReturnType<typeof drizzle>

  constructor(db: ReturnType<typeof drizzle>) {
    this.db = db
  }

  async create(params: typeof credentialsTable.$inferInsert) {
    const [cred] = await this.db.insert(credentialsTable).values(params).returning()

    return cred as DBCredential
  }

  async get(id: string) {
    const [cred] = await this.db
      .select()
      .from(credentialsTable)
      .where(eq(credentialsTable.id, id))
      .limit(1)

    return cred as DBCredential | null
  }

  async getBulk(ids: string[]) {
    const creds = await this.db
      .select()
      .from(credentialsTable)
      .where(inArray(credentialsTable.id, ids))

    return creds as DBCredential[]
  }

  async reverify(id: string, reverifiedId: string) {
    await this.db
      .update(credentialsTable)
      .set({ reverified_id: reverifiedId, updated_at: new Date() })
      .where(eq(credentialsTable.id, id))
  }

  async addToVault(credentialId: string, vaultId: string) {
    await this.db
      .update(credentialsTable)
      .set({ vault_id: vaultId })
      .where(eq(credentialsTable.id, credentialId))
  }

  async removeFromVault(credentialId: string) {
    await this.db
      .update(credentialsTable)
      .set({ vault_id: null })
      .where(eq(credentialsTable.id, credentialId))
  }
}
