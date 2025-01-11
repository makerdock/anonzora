import { createElysia } from '../utils'
import { t } from 'elysia'
import { zerion } from '../services/zerion'
import { simplehash } from '../services/simplehash'
import { getZerionChain } from '@anonworld/common'
import { db } from '../db'

export const walletRoutes = createElysia({ prefix: '/wallet' })
  .get(
    '/:address/fungibles',
    async ({ params }) => {
      const data = await zerion.getFungiblePositions(params.address)

      const tokenIds = data.map((t) => {
        const chain = getZerionChain(t.relationships.chain.data.id)
        const impl = t.attributes.fungible_info.implementations.find(
          (i) => i.chain_id === chain.zerionId
        )
        return `${chain.id}:${impl?.address}`
      })

      const knownTokens = await db.tokens.getClankerTokens(tokenIds)

      return {
        data: data.map((t) => {
          const chain = getZerionChain(t.relationships.chain.data.id)
          const impl = t.attributes.fungible_info.implementations.find(
            (i) => i.chain_id === chain.zerionId
          )

          const knownToken = knownTokens[`${chain.id}:${impl?.address}`]
          if (!knownToken) return t

          return {
            ...t,
            attributes: {
              ...t.attributes,
              value: t.attributes.value ?? knownToken.price_usd ?? 0,
              fungible_info: {
                ...t.attributes.fungible_info,
                icon: {
                  url: knownToken.image_url,
                },
              },
            },
          }
        }),
      }
    },
    {
      params: t.Object({
        address: t.String(),
      }),
    }
  )
  .get(
    '/:address/nfts',
    async ({ params }) => {
      const [byFloorPrice, byTransferTime, byTransferTimeAsc] = await Promise.all([
        simplehash.getNFTsForWallet(params.address, 'floor_price__desc'),
        simplehash.getNFTsForWallet(params.address, 'transfer_time__desc'),
        simplehash.getNFTsForWallet(params.address, 'transfer_time__asc', [
          'base',
          'zora',
        ]),
      ])

      const result = [
        ...byFloorPrice.nfts,
        ...byTransferTime.nfts,
        ...byTransferTimeAsc.nfts,
      ].filter((v, i, arr) => {
        return arr.findIndex((t) => t.nft_id === v.nft_id) === i
      })

      return {
        data: result.sort(
          (a, b) =>
            (b.collection.floor_prices?.[0]?.value_usd_cents || 0) -
            (a.collection.floor_prices?.[0]?.value_usd_cents || 0)
        ),
      }
    },
    {
      params: t.Object({
        address: t.String(),
      }),
    }
  )
