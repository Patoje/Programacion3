import { useAccount } from 'wagmi'
import { WalletConnection } from './components/WalletConnection'
import FaucetClaim from './components/FaucetClaim'
import TokenBalance from './components/TokenBalance'
import TokenTransfer from './components/TokenTransfer'
import TokenApproval from './components/TokenApproval';
import { FaucetUsers } from './components/FaucetUsers'
import AuthGuide from './components/AuthGuide'
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
          {/* Sección izquierda - Faucet y Balance */}
          <div className="left-section">
            <AuthGuide />
            <FaucetClaim />
            {isConnected && <TokenBalance />}
          </div>
          
          {/* Sección derecha - Funciones ERC20 y Usuarios */}
          <div className="right-section">
            {isConnected ? (
              <>
                <TokenTransfer />
                <TokenApproval />
              </>
            ) : (
              <div className="welcome-card">
                <h3>🔗 Conecta tu Wallet</h3>
                <p>
                  Para acceder a todas las funciones de la DApp, conecta tu wallet MetaMask 
                  o cualquier wallet compatible con Ethereum.
                </p>
                <div className="features-list">
                  <div className="feature-item">
                    <span className="feature-icon">🎁</span>
                    <span>Reclama 1,000,000 tokens gratuitos</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">💰</span>
                    <span>Consulta tu balance de tokens</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📤</span>
                    <span>Transfiere tokens a otras direcciones</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">✅</span>
                    <span>Aprueba gastos de tokens</span>
                  </div>
                </div>
              </div>
            )}
            <FaucetUsers />
          </div>
        </div>
      </main>

      {/* Footer informativo */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>🎓 Proyecto Académico</h4>
            <p>
              Esta DApp es parte del curso de Programación III y demuestra 
              la integración de React con blockchain Ethereum.
            </p>
          </div>
          <div className="footer-section">
            <h4>🔧 Tecnologías</h4>
            <ul>
              <li>React + TypeScript</li>
              <li>Wagmi + Viem</li>
              <li>Web3Modal v3</li>
              <li>Ethereum Sepolia</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>⚠️ Importante</h4>
            <p>
              Utiliza únicamente la red de prueba Sepolia. 
              Nunca uses tokens reales en esta aplicación.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
