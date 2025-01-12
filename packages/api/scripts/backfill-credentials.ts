import { keccak256 } from 'viem'
import { db } from '../src/db'
import { credentialsTable } from '../src/db/schema'
import { eq, isNull, or } from 'drizzle-orm'

async function main() {
  const credentials = await db.db
    .select()
    .from(credentialsTable)
    .where(or(isNull(credentialsTable.hash), isNull(credentialsTable.parent_id)))
  console.log(`Found ${credentials.length} credentials`)
  for (let i = 0; i < credentials.length; i++) {
    console.log(`Processing credential ${i + 1} of ${credentials.length}`)
    const credential = credentials[i]
    await db.db
      .update(credentialsTable)
      .set({
        hash: keccak256(credential.id as `0x${string}`),
        parent_id: credential.id,
      })
      .where(eq(credentialsTable.id, credential.id))
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
