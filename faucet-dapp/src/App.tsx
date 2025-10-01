import { useAccount } from 'wagmi'
import { WalletConnection } from './components/WalletConnection'
import FaucetClaim from './components/FaucetClaim'
import { FaucetUsers } from './components/FaucetUsers'
import './App.css'

/**
 * Componente principal de la aplicación Faucet DApp
 * Aplicación Web3 completa para interactuar con smart contracts ERC20
 */
function App() {
  const { isConnected } = useAccount()

  return (
    <div className="app">
      {/* Header con navegación y conexión de wallet */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="app-title">
              <span className="logo-icon">🚰</span>
              Faucet DApp
            </h1>
            <p className="app-subtitle">
              Reclama tokens gratuitos en Ethereum Sepolia
            </p>
          </div>
          <WalletConnection />
        </div>
      </header>

      {/* Contenido principal */}
      <main className="app-main">
        <div className="main-content">
          {/* Sección principal - Faucet */}
          <div className="main-section">
            <FaucetClaim />
            <FaucetUsers />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
