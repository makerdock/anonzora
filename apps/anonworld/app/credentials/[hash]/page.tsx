'use client'

import { Content } from '@/components/content'
import { CredentialDisplay, CredentialPostFeed, useCredential } from '@anonworld/react'

export default function Page({ params }: { params: { hash: string } }) {
  const { data: credential } = useCredential({ hash: params.hash })
  if (!credential) return null
  return (
    <Content>
      <CredentialDisplay credential={credential} />
      <CredentialPostFeed hash={params.hash} />
    </Content>
  )
}
