import { createElysia } from '../utils'
import { concat, erc20Abi, hexToNumber, keccak256, pad, toHex, zeroAddress } from 'viem'
import { t } from 'elysia'
import { redis } from '../services/redis'
import { db } from '../db'
import { getChain } from '@anonworld/common'
import { tokens } from '../services/tokens'
import { ContractType, StorageType } from '@anonworld/common'

const ZAPPER_API_URL = "https://public.zapper.xyz/graphql"
const ZAPPER_API_KEY = "0e23c091-27ef-48e2-9e88-bfa19363a320" // Public demo key

export const evmRoutes = createElysia({ prefix: '/evm' }).post(
  '/storage-slot',
  async ({ body, error }) => {
    try {
      console.log('Storage slot request received:', body)
      
      const chainId = body.chainId
      const contractAddress = body.contractAddress.toLowerCase()
      const contractType = body.contractType as ContractType
      const storageType = body.storageType as StorageType
      
      console.log(`Processing storage slot for: Chain ${chainId}, Token ${contractAddress}, Type ${contractType}`)

    let cached = await redis.getStorageSlot(chainId, contractAddress, storageType)
    if (cached) {
      return {
        slot: hexToNumber(cached as `0x${string}`),
      }
    }

    let holder: { address: string; balance: bigint } | null = null

    const chain = getChain(chainId)

    let slot: number | null = null
    if (contractType === ContractType.ERC20) {
      // First try Zapper API to get token holders
      try {
        const zapperHolder = await getTopTokenHolderFromZapper(chainId, contractAddress)
        if (zapperHolder) {
          holder = zapperHolder
          console.log(`Found holder via Zapper: ${holder.address} with balance ${holder.balance}`)
        }
      } catch (error) {
        console.error('Zapper API failed, falling back to common addresses:', error)
      }

      // If Zapper fails, try some common addresses that might hold the token
      if (!holder) {
        const commonAddresses = [
          zeroAddress,
          '0x000000000000000000000000000000000000dead', // burn address
          '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
          '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
          '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 Router
        ]
        
        for (const address of commonAddresses) {
          try {
            const balance = await chain.client.readContract({
              address: contractAddress as `0x${string}`,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [address as `0x${string}`],
            })
            if (balance > BigInt(0)) {
              holder = { address, balance }
              console.log(`Found holder via fallback: ${address} with balance ${balance}`)
              break
            }
          } catch (error) {
            console.error(`Error checking balance for ${address}:`, error)
          }
        }
      }
    }
    if (contractType === ContractType.ERC721) {
      // For NFTs, we'd need a different approach since SimpleHash is deprecated
      // For now, let's skip NFT support until we find an alternative
      console.error('NFT support temporarily disabled due to deprecated SimpleHash')
      return error(501, 'NFT credential verification temporarily unavailable')
    }

    if (!holder) {
      console.error(`No holder found for ${contractType} at ${contractAddress} on chain ${chainId}`)
      return error(404, 'Failed to find balance storage slot')
    }
    
    console.log(`Found holder: ${holder.address} with balance: ${holder.balance}`)

    slot = await getStorageSlot(chainId, contractAddress, holder.address, holder.balance)

    if (slot === null) {
      console.error(`Storage slot detection failed for ${contractAddress} on chain ${chainId}`)
      return error(404, 'Failed to find balance storage slot')
    }
    
    console.log(`Found storage slot: ${slot}`)

    await tokens.getOrCreate({
      contractType: contractType,
      chainId: chainId,
      address: contractAddress,
    })

    await db.tokens.update(`${chainId}:${contractAddress}`, {
      balance_slot: slot,
    })

    await redis.setStorageSlot(chainId, contractAddress, StorageType.BALANCE, toHex(slot))

    return { slot }
    } catch (err) {
      console.error('Storage slot detection error:', err)
      return error(500, `Storage slot detection failed: ${err.message || 'Unknown error'}`);
    }
  },
  {
    body: t.Object({
      chainId: t.Number(),
      contractAddress: t.String(),
      contractType: t.String(),
      storageType: t.String(),
    }),
  }
)

async function getStorageSlot(
  chainId: number,
  contractAddress: string,
  walletAddress: string,
  value: bigint
) {
  const chain = getChain(chainId)

  let slotWithData = null

  // Milady Cult // unsupported in circuit because of storage key computation
  if (
    chainId === 1 &&
    contractAddress.toLowerCase() === '0x0000000000c5dc95539589fbd24be07c6c14eca4'
  ) {
    const seed = '0x87a211a2'
    const storageKey = keccak256(
      concat([walletAddress as `0x${string}`, pad(seed, { size: 12 })])
    )
    const data = await chain.client.getStorageAt({
      address: contractAddress as `0x${string}`,
      slot: storageKey,
    })

    if (data) {
      if (BigInt(data) === value) return null
    }
    return null
  }

  for (let slot = 0; slot < 200; slot++) {
    const storageKey = keccak256(
      concat([pad(walletAddress as `0x${string}`), pad(toHex(slot))])
    )
    const data = await chain.client.getStorageAt({
      address: contractAddress as `0x${string}`,
      slot: storageKey,
    })
    if (!data) continue

    const dataValue = BigInt(data)
    if (dataValue === BigInt(0)) continue

    if (slotWithData === null) {
      slotWithData = slot
    }

    if (dataValue === value) {
      return slot
    }
  }

  return slotWithData
}

async function getTopTokenHolderFromZapper(chainId: number, tokenAddress: string): Promise<{ address: string; balance: bigint } | null> {
  try {
    const query = `
      query TokenHolders($address: Address!, $chainId: Int!, $first: Float!) {
        fungibleTokenV2(address: $address, chainId: $chainId) {
          address
          symbol
          name
          decimals
          holders(first: $first) {
            edges {
              node {
                holderAddress
                value
              }
            }
          }
        }
      }
    `

    const variables = {
      address: tokenAddress,
      chainId: chainId,
      first: 10, // Get top 10 holders
    }

    const response = await fetch(ZAPPER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-zapper-api-key": ZAPPER_API_KEY,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Zapper API error: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Zapper API HTTP error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Zapper API response:', JSON.stringify(data, null, 2))
    
    if (data.errors) {
      throw new Error(`Zapper GraphQL error: ${data.errors[0]?.message || 'Unknown error'}`)
    }

    const tokenData = data.data?.fungibleTokenV2
    if (!tokenData || !tokenData.holders?.edges?.length) {
      throw new Error('No token holders found')
    }

    // Get the first holder with a non-zero balance
    const holder = tokenData.holders.edges[0]?.node
    if (!holder || !holder.value || BigInt(holder.value) === BigInt(0)) {
      throw new Error('No holder with non-zero balance found')
    }

    return {
      address: holder.holderAddress,
      balance: BigInt(holder.value)
    }
  } catch (error) {
    console.error('Zapper API error:', error)
    return null
  }
}
