'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

if (typeof window !== 'undefined') {
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag while rendering')) {
      return
    }
    originalError(...args)
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="firefoxx-theme"
    >
      {children}
    </NextThemesProvider>
  )
}