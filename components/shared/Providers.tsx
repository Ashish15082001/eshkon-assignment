'use client'

import { SessionProvider } from 'next-auth/react'
import ReduxProvider from './ReduxProvider'
import type { ReactNode } from 'react'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ReduxProvider>{children}</ReduxProvider>
    </SessionProvider>
  )
}
