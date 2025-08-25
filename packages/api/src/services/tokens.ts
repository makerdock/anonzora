import { ContractType } from '@anonworld/common'
import { db } from '../db'
import { DBToken } from '../db/types'
import { redis } from './redis'
import { simplehash } from './simplehash'
import { zerion } from './zerion'
import { formatUnits, zeroAddress } from 'viem'

class TokensService {
  async getOrCreate({
    contractType,
    chainId,
    address,
  }: { contractType: string; chainId: number; address: string }) {
    switch (contractType as ContractType) {
      case ContractType.ERC20:
        return this.getOrCreateERC20(chainId, address)
      case ContractType.ERC721:
        return this.getOrCreateERC721(chainId, address)
    }
  }
  async getOrCreateERC20(chainId: number, tokenAddress: string) {
    // const token = await redis.getToken(chainId, tokenAddress)
    // if (token) return JSON.parse(token)
    return this.syncERC20(chainId, tokenAddress)
  }

  async syncERC20(chainId: number, tokenAddress: string) {
    const id = `${chainId}:${tokenAddress}`
    const token = await db.tokens.get(id)
    if (token) {
      if (token.type === ContractType.ERC721) {
        return await this.updateERC721(token)
      }
      return await this.updateERC20(token)
    }
    return await this.createERC20(chainId, tokenAddress)
  }

  async updateERC20(token: DBToken) {
    let zapperToken = null
    
    try {
      zapperToken = await this.getZapperTokenData(token.chain_id, token.address)
    } catch (error) {
      console.warn(`Failed to fetch Zapper token data for ${token.chain_id}:${token.address}:`, error.message)
    }

    if (!zapperToken) {
      // Return existing token data if API call fails
      return token
    }

    const fields = {
      price_usd: zapperToken.priceData?.price?.toFixed(8) ?? token.price_usd,
      market_cap: Math.round(zapperToken.priceData?.marketCap ?? 0),
      total_supply: Math.round(zapperToken.priceData?.totalSupply ?? 0),
      holders: 0, // Zapper requires separate query for holders count
    }

    try {
      await db.tokens.update(token.id, fields)
    } catch (e) {
      console.error(`Failed to update token ${token.id}:`, e)
      return token
    }

    const result = {
      ...token,
      ...fields,
    }

    await redis.setToken(token.chain_id, token.address, JSON.stringify(result))

    return result
  }

  async updateNative(token: DBToken) {
    const zerionToken = await zerion.getFungible(token.chain_id, token.address)

    const prices = [zerionToken?.attributes.market_data.price?.toFixed(10), '0']

    for (const price of prices) {
      if (!price) continue

      const marketCap = token.total_supply * Number(price)
      const fields = {
        price_usd: price,
        market_cap: Math.round(marketCap),
      }

      try {
        await db.tokens.update(token.id, fields)
      } catch (e) {
        continue
      }

      const result = {
        ...token,
        ...fields,
      }
      await redis.setToken(token.chain_id, token.address, JSON.stringify(result))

      return result
    }
  }

  async createERC20(chainId: number, tokenAddress: string) {
    const id = `${chainId}:${tokenAddress}`
    
    let zapperToken = null
    
    try {
      zapperToken = await this.getZapperTokenData(chainId, tokenAddress)
    } catch (error) {
      console.warn(`Failed to fetch Zapper token data for ${chainId}:${tokenAddress}:`, error.message)
    }

    const token = {
      id: id.toLowerCase(),
      chain_id: chainId,
      address: tokenAddress.toLowerCase(),
      symbol: zapperToken?.symbol ?? 'UNKNOWN',
      name: zapperToken?.name ?? 'Unknown Token',
      decimals: zapperToken?.decimals ?? 18,
      image_url: zapperToken?.imageUrlV2,
      price_usd: zapperToken?.priceData?.price?.toFixed(8) ?? 0,
      market_cap: Math.round(zapperToken?.priceData?.marketCap ?? 0),
      total_supply: Math.round(zapperToken?.priceData?.totalSupply ?? 0),
      holders: 0, // We can get this from holders query if needed
      balance_slot: null,
      type: tokenAddress === zeroAddress ? 'NATIVE' : 'ERC20',
    }
    await db.tokens.create(token)
    await redis.setToken(chainId, tokenAddress, JSON.stringify(token))

    return token
  }

  async createNewERC20(args: {
    chainId: number
    address: string
    name: string
    symbol: string
    imageUrl: string
    platform: string
  }) {
    const id = `${args.chainId}:${args.address}`
    const token = {
      id: id.toLowerCase(),
      chain_id: args.chainId,
      address: args.address.toLowerCase(),
      symbol: args.symbol,
      name: args.name,
      decimals: 18,
      image_url: args.imageUrl,
      price_usd: '0',
      market_cap: 0,
      total_supply: 0,
      holders: 0,
      balance_slot: null,
      type: ContractType.ERC20,
      platform: args.platform,
    }
    await db.tokens.create(token)
    await redis.setToken(args.chainId, args.address.toLowerCase(), JSON.stringify(token))
    return token
  }

  async getOrCreateERC721(chainId: number, tokenAddress: string) {
    const token = await redis.getToken(chainId, tokenAddress)
    if (token) return JSON.parse(token)
    return this.syncERC721(chainId, tokenAddress)
  }

  async syncERC721(chainId: number, tokenAddress: string) {
    const id = `${chainId}:${tokenAddress}`
    const token = await db.tokens.get(id)
    if (token) {
      await this.updateERC721(token)
    } else {
      await this.createERC721(chainId, tokenAddress)
    }
  }

  async updateERC721(token: DBToken) {
    const collection = await simplehash.getNFTCollection(token.chain_id, token.address)
    if (!collection) return

    let floorPrice = 0
    if (collection.floor_prices && collection.floor_prices.length > 0) {
      floorPrice = Math.min(
        ...collection.floor_prices.map((fp) => fp.value_usd_cents / 100)
      )
    } else {
      floorPrice = collection.top_bids[0]?.value_usd_cents ?? 0
    }

    const fields = {
      image_url: collection.image_url,
      price_usd: floorPrice.toFixed(8),
      market_cap: Math.round(floorPrice * collection.distinct_nft_count),
      holders: collection.distinct_owner_count,
      total_supply: collection.distinct_nft_count,
    }
    await db.tokens.update(token.id, fields)

    const result = {
      ...token,
      ...fields,
    }

    await redis.setToken(token.chain_id, token.address, JSON.stringify(result))

    return result
  }

  async createERC721(chainId: number, tokenAddress: string) {
    const id = `${chainId}:${tokenAddress}`
    const collection = await simplehash.getNFTCollection(chainId, tokenAddress)
    if (!collection) return

    let floorPrice = 0
    if (collection.floor_prices && collection.floor_prices.length > 0) {
      floorPrice = Math.min(
        ...collection.floor_prices.map((fp) => fp.value_usd_cents / 100)
      )
    }

    const token = {
      id: id.toLowerCase(),
      chain_id: chainId,
      address: tokenAddress.toLowerCase(),
      symbol: collection.top_contract_details[0]?.symbol ?? '',
      name: collection.name,
      decimals: 0,
      image_url: collection.image_url,
      price_usd: floorPrice.toFixed(8),
      market_cap: Math.round(floorPrice * collection.distinct_nft_count),
      total_supply: collection.distinct_nft_count,
      holders: collection.distinct_owner_count,
      type: tokenAddress === zeroAddress ? 'NATIVE' : 'ERC721',
    }
    await db.tokens.create(token)
    await redis.setToken(chainId, tokenAddress, JSON.stringify(token))

    return token
  }

  async getZapperTokenData(chainId: number, tokenAddress: string) {
    const ZAPPER_API_URL = "https://public.zapper.xyz/graphql"
    const ZAPPER_API_KEY = "0e23c091-27ef-48e2-9e88-bfa19363a320" // Public demo key

    const query = `
      query TokenData($address: Address!, $chainId: Int!) {
        fungibleTokenV2(address: $address, chainId: $chainId) {
          address
          symbol
          name
          decimals
          imageUrlV2
          priceData {
            price
            marketCap
            volume24h
            totalLiquidity
            priceChange24h
          }
        }
      }
    `

    const variables = {
      address: tokenAddress,
      chainId: chainId,
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
    
    if (data.errors) {
      throw new Error(`Zapper GraphQL error: ${data.errors[0]?.message || 'Unknown error'}`)
    }

    return data.data?.fungibleTokenV2
  }
}

export const tokens = new TokensService()
