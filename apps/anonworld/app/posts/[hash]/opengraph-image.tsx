import { AnonWorldSDK } from '@anonworld/sdk'
import { ImageResponse } from 'next/og'
import { Credential, CredentialType, getCredential, Token } from '@anonworld/common'
import { ReactNode } from 'react'

const sdk = new AnonWorldSDK()

async function loadFont() {
  const response = await fetch(
    new URL(
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
    )
  )
  const css = await response.text()
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/)

  if (!resource) throw new Error('Failed to load font')

  const fontResponse = await fetch(resource[1])
  return fontResponse.arrayBuffer()
}

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = {
  width: 1200,
  height: 630,
}

export default async function Image({ params }: { params: { hash: string } }) {
  const post = await sdk.getPost(params.hash).then((post) => post.data)
  if (!post) return null

  const text = post.text || params.hash
  const fontData = await loadFont()

  const vaultId = post.credentials?.[0]?.vault_id
  const maxCredentials = 5 + (vaultId ? 1 : 0)

  return new ImageResponse(
    <div
      style={{
        background: '#050505',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 32,
        fontFamily: 'Geist',
        color: 'white',
        gap: 32,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          marginRight: 100,
          gap: 16,
        }}
      >
        {vaultId && <VaultBadge vaultId={vaultId} />}
        {post.credentials.slice(0, maxCredentials).map((credential, i) => (
          <CredentialBadge key={i} credential={credential} />
        ))}
      </div>

      <img
        src="https://anon.world/logo.svg"
        alt="AnonWorld"
        height={100}
        width={100}
        style={{
          display: 'flex',
          position: 'absolute',
          top: 16,
          right: 32,
        }}
      />

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#151515',
          borderColor: '#424242',
          borderWidth: 1.5,
          borderRadius: 16,
          padding: 32,
        }}
      >
        <div
          style={{
            fontSize: 40,
            lineHeight: 1.4,
            fontWeight: 600,
            display: '-webkit-box',
            WebkitLineClamp: 5,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'pre-wrap',
          }}
        >
          {text}
        </div>
      </div>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div />
        <DateBadge timestamp={post.timestamp} />
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          style: 'normal',
        },
      ],
    }
  )
}

function VaultBadge({ vaultId }: { vaultId: string }) {
  const id = formatHexId(vaultId)
  const { background, secondary } = toHslColors(id)
  return (
    <Badge
      image={
        <div
          style={{
            width: 40,
            height: 40,
            background: `linear-gradient(135deg, ${secondary}, ${background})`,
            borderRadius: 40,
          }}
        />
      }
    >
      {id}
    </Badge>
  )
}

function TokenImage({ token }: { token: Token }) {
  const { background, secondary } = toHslColors(token.address)

  if (token.image_url) {
    return (
      <img
        src={token.image_url}
        alt="Token"
        height={40}
        width={40}
        style={{ borderRadius: 40 }}
      />
    )
  }

  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 40,
        background: `linear-gradient(135deg, ${secondary}, ${background})`,
      }}
    />
  )
}

function CredentialBadge({ credential }: { credential: Credential & { token: Token } }) {
  switch (credential.type) {
    case CredentialType.ERC20_BALANCE: {
      const amount =
        BigInt(credential.metadata.balance) / BigInt(10 ** credential.token.decimals)
      return (
        <Badge
          image={<TokenImage token={credential.token} />}
        >{`${formatAmount(Number(amount))} ${credential.token.symbol}`}</Badge>
      )
    }
    case CredentialType.ERC721_BALANCE:
      return (
        <Badge
          image={<TokenImage token={credential.token} />}
        >{`${credential.token.name} Holder`}</Badge>
      )
    default:
      return null
  }
}

function DateBadge({ timestamp }: { timestamp: string }) {
  const date = new Date(timestamp)
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return <Badge>{formatted}</Badge>
}

function Badge({ children, image }: { children: ReactNode; image?: ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: '#191919',
        borderColor: '#494949',
        borderWidth: 1.5,
        borderRadius: 64,
        paddingRight: 16,
        paddingLeft: 16,
        height: 64,
        display: 'flex',
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
      }}
    >
      {image}
      <span style={{ fontSize: 32, color: 'white' }}>{children}</span>
    </div>
  )
}

function formatAmount(num: number): string {
  if (num < 1000) return num.toString()
  const units = ['K', 'M', 'B', 'T']
  const unitIndex = Math.floor(Math.log10(num) / 3) - 1
  const unitValue = 1000 ** (unitIndex + 1)
  const formattedNumber = (num / unitValue).toFixed(1)
  return `${formattedNumber}${units[unitIndex]}`
}

function formatHexId(hex: string) {
  let str = ''
  for (let i = 2; i < hex.length - 1; i += 2) {
    const num = Number.parseInt(hex.slice(i, i + 2), 16)
    if (!Number.isNaN(num)) {
      // Ensure we only get values 0-61
      const code = Math.abs(num) % 62
      // 0-9: 48-57 in ASCII
      // A-Z: 65-90 in ASCII
      // a-z: 97-122 in ASCII
      if (code < 10) {
        str += String.fromCharCode(48 + code) // 0-9
      } else if (code < 36) {
        str += String.fromCharCode(65 + (code - 10)) // A-Z
      } else {
        str += String.fromCharCode(97 + (code - 36)) // a-z
      }
    }
  }
  return str.slice(0, 8)
}

function toHslColors(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return {
    background: hslToHex(hue, 70, 85),
    secondary: hslToHex(hue, 70, 50),
    color: hslToHex(hue, 70, 15),
  }
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100
  const a = (s * Math.min(l, 1 - l)) / 100

  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }

  return `#${f(0)}${f(8)}${f(4)}`
}
