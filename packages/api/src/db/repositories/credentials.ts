import { drizzle } from 'drizzle-orm/node-postgres'
import {
  credentialsTable,
  vaultsTable,
  postCredentialsTable,
  postRelationshipsTable,
} from '../schema'
import { DBCredential } from '../types'
import { and, eq, inArray, isNull } from 'drizzle-orm'

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
      .leftJoin(vaultsTable, eq(credentialsTable.vault_id, vaultsTable.id))
      .where(eq(credentialsTable.id, id))
      .limit(1)

    if (!cred) {
      return null
    }

    return {
      ...cred.credential_instances,
      vault: {
        ...cred.vaults,
        passkeyId: undefined,
      },
    } as DBCredential
  }

  async getByHash(hash: string) {
    const [cred] = await this.db
      .select()
      .from(credentialsTable)
      .where(eq(credentialsTable.hash, hash))
      .limit(1)

    return cred as DBCredential | null
  }

  async getByHashes(hashes: string[]) {
    const creds = await this.db
      .select()
      .from(credentialsTable)
      .where(inArray(credentialsTable.hash, hashes))

    return creds as DBCredential[]
  }

  async getChildren(parentId: string) {
    const creds = await this.db
      .select()
      .from(credentialsTable)
      .where(eq(credentialsTable.parent_id, parentId))

    return creds as DBCredential[]
  }

  async getByHashWithVault(hash: string) {
    const [cred] = await this.db
      .select()
      .from(credentialsTable)
      .leftJoin(vaultsTable, eq(credentialsTable.vault_id, vaultsTable.id))
      .where(eq(credentialsTable.hash, hash))
      .limit(1)

    if (!cred) {
      return null
    }

    return {
      ...cred.credential_instances,
      vault: {
        ...cred.vaults,
        passkeyId: undefined,
      },
    } as DBCredential
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

  async batchRemoveFromVault(vaultId: string) {
    await this.db
      .update(credentialsTable)
      .set({ vault_id: null })
      .where(eq(credentialsTable.vault_id, vaultId))
  }

  async getPostsForCredentialIds(credentialIds: string[]) {
    return await this.db
      .select()
      .from(postCredentialsTable)
      .where(inArray(postCredentialsTable.credential_id, credentialIds))
  }
}
