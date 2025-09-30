import { useAccount, useDisconnect } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'

/**
 * Componente para manejar la conexión y desconexión de wallets
 */
export function WalletConnection() {
  const { address, isConnected, isConnecting } = useAccount()
  const { disconnect } = useDisconnect()
  const { open } = useWeb3Modal()

  // Función para truncar la dirección de la wallet
  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnecting) {
    return (
      <div className="wallet-connection">
        <button className="wallet-button connecting" disabled>
          <div className="spinner"></div>
          Conectando...
        </button>
      </div>
    )
  }

  if (isConnected && address) {
    return (
      <div className="wallet-connection">
        <div className="wallet-info">
          <span className="wallet-address">{truncateAddress(address)}</span>
          <button 
            className="disconnect-button"
            onClick={() => disconnect()}
          >
            Desconectar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="wallet-connection">
      <button 
        className="wallet-button"
        onClick={() => open()}
      >
        Conectar Wallet
      </button>
    </div>
  )
}