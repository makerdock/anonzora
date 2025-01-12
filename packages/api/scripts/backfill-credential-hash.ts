import { keccak256 } from 'viem'
import { db } from '../src/db'
import { credentialsTable } from '../src/db/schema'
import { eq, isNull } from 'drizzle-orm'

async function main() {
  const credentials = await db.db
    .select()
    .from(credentialsTable)
    .where(isNull(credentialsTable.hash))
  console.log(`Found ${credentials.length} credentials`)
  for (const credential of credentials) {
    await db.db
      .update(credentialsTable)
      .set({ hash: keccak256(credential.id as `0x${string}`) })
      .where(eq(credentialsTable.id, credential.id))
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
