'use client'

import sdk from '@farcaster/frame-sdk'
import { createContext, useContext, ReactNode, useEffect, useState } from 'react'

type FramesContextType = {
  isFrame: boolean
}

const FramesContext = createContext<FramesContextType | undefined>(undefined)

export function FramesProvider({ children }: { children: ReactNode }) {
  const [isFrame, setIsFrame] = useState(false)

  const handleLoad = async () => {
    const context = await sdk.context
    if (context) {
      setIsFrame(true)
      await sdk.actions.ready()
    }
  }

  useEffect(() => {
    handleLoad()
  }, [])

  return <FramesContext.Provider value={{ isFrame }}>{children}</FramesContext.Provider>
}

export function useFrames() {
  const context = useContext(FramesContext)
  if (!context) {
    throw new Error('useFrames must be used within a FramesProvider')
  }
  return context
}
