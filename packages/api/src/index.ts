import { config } from 'dotenv'
import { resolve } from 'path'
import { createElysia } from './utils'

// Load .env from packages directory
config({ path: resolve(__dirname, '../../.env') })
import { actionsRoutes } from './routes/actions'
import { postsRoutes } from './routes/posts'
import { feedsRoutes } from './routes/feeds'
import { uploadRoutes } from './routes/upload'
import { farcasterRoutes } from './routes/farcaster'
import { credentialsRoutes } from './routes/credentials'
import { walletRoutes } from './routes/wallet'
import { tokenRoutes } from './routes/tokens'
import { communitiesRoutes } from './routes/communities'
import { authRoutes } from './routes/auth'
import { vaultsRoutes } from './routes/vaults'
import { evmRoutes } from './routes/evm'
import { nftRoutes } from './routes/nfts'
import { leaderboardRoutes } from './routes/leaderboard'

const app = createElysia()
  .use(actionsRoutes)
  .use(postsRoutes)
  .use(feedsRoutes)
  .use(uploadRoutes)
  .use(farcasterRoutes)
  .use(credentialsRoutes)
  .use(walletRoutes)
  .use(tokenRoutes)
  .use(communitiesRoutes)
  .use(authRoutes)
  .use(vaultsRoutes)
  .use(evmRoutes)
  .use(nftRoutes)
  .use(leaderboardRoutes)

app.listen(process.env.PORT || 3001)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
