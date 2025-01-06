'use client'

import { NeynarContextProvider, Theme, NeynarAuthButton } from '@neynar/react'

export default function SignInWithNeynar() {
  return (
    <NeynarContextProvider
      settings={{
        clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || '',
        defaultTheme: Theme.Light,
        eventsCallbacks: {
          onAuthSuccess: (data) => {
            console.log(data)
          },
          onSignout() {},
        },
      }}
    >
      <NeynarAuthButton />
    </NeynarContextProvider>
  )
}
