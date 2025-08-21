'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { zora } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './providers/ThemeProvider'
import FarcasterProvider from './providers/FarcasterProvider'
import { AuthProvider } from './providers/AuthProvider'

const config = createConfig({
  chains: [zora],
  transports: {
    [zora.id]: http(),
  },
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
    >
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <FarcasterProvider>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </FarcasterProvider>
            </QueryClientProvider>
        </WagmiProvider>
    </ThemeProvider>
  )
}

