import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createWeb3Modal } from '@web3modal/wagmi/react'

import App from './App.tsx'
import { config } from './config/wagmi.ts'
import './index.css'
import './styles/darkTheme.css'
import './styles/components.css'

// 1. Setup queryClient
const queryClient = new QueryClient()

// 2. Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId: '2f05a7cde2bb14b478f07e581c0e2130', // Project ID válido para desarrollo
  enableAnalytics: false, // Deshabilitado para desarrollo
  enableOnramp: false, // Deshabilitado para desarrollo
  themeMode: 'dark'
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
