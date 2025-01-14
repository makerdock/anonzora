// TODO: Reorganize this file into credentials package

import { createElysia } from '../utils'
import { t } from 'elysia'
import { keccak256, zeroAddress, pad, concat, toHex } from 'viem'
import { Credential, CredentialType, getChain } from '@anonworld/common'
import { db } from '../db'
import { CredentialsManager } from '@anonworld/credentials'
import { feed } from '../services/feed'
import { redis } from '../services/redis'

export const credentialsRoutes = createElysia({ prefix: '/credentials' })
  .post(
    '/',
    async ({ body }) => {
      if (!body.type || !body.version) {
        throw new Error('Invalid type or version')
      }

      const credentialType = body.type as CredentialType
      const manager = new CredentialsManager()
      const circuit = manager.getVerifier(credentialType, body.version)

      const verified = await circuit.verifyProof({
        proof: new Uint8Array(body.proof),
        publicInputs: body.publicInputs,
      })
      if (!verified) {
        throw new Error('Invalid proof')
      }

      const metadata = circuit.parseData(body.publicInputs)
      const address =
        'tokenAddress' in metadata ? metadata.tokenAddress : metadata.contractAddress
      const credentialId = `${body.type}:${metadata.chainId}:${address.toLowerCase()}`
      const slot = 'balanceSlot' in metadata ? metadata.balanceSlot : metadata.storageSlot

      const id = keccak256(new Uint8Array(body.proof))
      const existingCredential = await db.credentials.get(id)
      if (existingCredential) {
        return {
          ...existingCredential,
          proof: undefined,
        }
      }

      const chain = getChain(metadata.chainId)

      const block = await chain.client.getBlock({
        blockNumber: BigInt(metadata.blockNumber),
      })

      const ethProof = await chain.client.getProof({
        address: address as `0x${string}`,
        storageKeys: [keccak256(concat([pad(zeroAddress), pad(toHex(slot))]))],
        blockNumber: BigInt(metadata.blockNumber),
      })

      if (ethProof.storageHash !== metadata.storageHash) {
        throw new Error('Invalid storage hash')
      }

      let parent: Credential | null = null
      if (body.parentId) {
        parent = await db.credentials.get(body.parentId)
      }

      const credential = await db.credentials.create({
        id,
        hash: keccak256(id),
        type: credentialType,
        credential_id: credentialId,
        metadata,
        version: circuit.version,
        proof: {
          proof: body.proof,
          publicInputs: body.publicInputs,
        },
        verified_at: new Date(Number(block.timestamp) * 1000),
        parent_id: parent?.parent_id ?? parent?.id ?? id,
        vault_id: parent?.vault_id,
      })

      if (parent?.id) {
        await db.credentials.reverify(parent.id, credential.id)
      }

      return {
        ...credential,
        proof: undefined,
      }
    },
    {
      body: t.Object({
        type: t.String(),
        version: t.String(),
        proof: t.Array(t.Number()),
        publicInputs: t.Array(t.String()),
        parentId: t.Optional(t.String()),
      }),
    }
  )
  .get('/:hash', async ({ params, error }) => {
    let credential = await db.credentials.getByHash(params.hash)
    if (credential?.reverified_id) {
      credential = await db.credentials.get(credential.parent_id)
    }

    if (!credential) {
      return error(404, 'Credential not found')
    }

    return {
      ...credential,
      id: undefined,
      proof: undefined,
      parent_id: undefined,
      reverified_id: undefined,
    }
  })
  .get('/:hash/posts', async ({ params, error }) => {
    const cached = await redis.getCredentialPostsFeed(params.hash)
    if (cached) {
      return { data: JSON.parse(cached) }
    }

    const credential = await db.credentials.getByHash(params.hash)
    if (!credential) {
      return error(404, 'Credential not found')
    }

    const children = await db.credentials.getChildren(credential.parent_id)
    const credentialPosts = await db.credentials.getPostsForCredentialIds(
      children.map((c) => c.id)
    )
    const hashes = credentialPosts.map((p) => p.post_hash)
    if (hashes.length === 0) return { data: [] }

    const posts = await db.posts.getFeedForHashes(hashes)
    console.log(credentialPosts.length, posts.length)
    const result = await feed.getFeed(posts.map((p) => p.posts))
    const data = result.filter((p) => !p.parent_hash)

    await redis.setCredentialPostsFeed(params.hash, JSON.stringify(data))

    return {
      data,
    }
  })
