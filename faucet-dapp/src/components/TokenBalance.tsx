import React from 'react';
import { useAccount } from 'wagmi';
import { useTokenBalance, useTokenSymbol, useTokenName, useTokenDecimals } from '../hooks/useFaucetToken';

/**
 * Componente para mostrar el balance de tokens del usuario
 * Incluye información detallada del token y balance actual
 */
const TokenBalance: React.FC = () => {
  const { address, isConnected } = useAccount();
  
  // Hooks para obtener información del token
  const { data: balance, isLoading: isBalanceLoading, error: balanceError, refetch } = useTokenBalance(address);
  const { data: symbol, isLoading: isSymbolLoading } = useTokenSymbol();
  const { data: name, isLoading: isNameLoading } = useTokenName();
  const { data: decimals, isLoading: isDecimalsLoading } = useTokenDecimals();

  /**
   * Maneja la actualización manual del balance
   */
  const handleRefreshBalance = () => {
    if (address) {
      refetch();
    }
  };

  // Renderizar contenido basado en el estado de conexión
  if (!isConnected) {
    return (
      <div className="balance-card">
        <div className="card-header">
          <h3>💰 Balance de Tokens</h3>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <h4>Conecta tu Wallet</h4>
          <p>Conecta tu wallet para ver tu balance de tokens</p>
        </div>
      </div>
    );
  }

  return (
    <div className="balance-card">
      <div className="card-header">
        <h3>💰 Balance de Tokens</h3>
        <button 
          className="refresh-button" 
          onClick={handleRefreshBalance}
          disabled={isBalanceLoading}
          title="Actualizar balance"
        >
          {isBalanceLoading ? '🔄' : '↻'}
        </button>
      </div>

      {/* Información del token */}
      <div className="token-info-section">
        <div className="token-header">
          <div className="token-icon">🪙</div>
          <div className="token-details">
            <h4 className="token-name">
              {isNameLoading ? (
                <div className="spinner"></div>
              ) : (
                name || 'FaucetToken'
              )}
            </h4>
            <p className="token-symbol">
              {isSymbolLoading ? (
                <div className="spinner"></div>
              ) : (
                symbol || 'FTKN'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Balance principal */}
      <div className="balance-main">
        {isBalanceLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando balance...</p>
          </div>
        ) : balanceError ? (
          <div className="error-state">
            <span>❌</span>
            <div>
              <h4>Error al cargar balance</h4>
              <p>{balanceError.message}</p>
              <button onClick={handleRefreshBalance} className="retry-button">
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <div className="balance-display">
            <div className="balance-amount">
              {balance?.formatted || '0'}
            </div>
            <div className="balance-symbol">
              {symbol || 'FTKN'}
            </div>
          </div>
        )}
      </div>

      {/* Información detallada */}
      <div className="balance-details">
        <div className="detail-item">
          <span className="detail-label">Balance Raw:</span>
          <span className="detail-value">
            {isBalanceLoading ? (
              <div className="spinner"></div>
            ) : (
              balance?.value?.toString() || '0'
            )}
          </span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Decimales:</span>
          <span className="detail-value">
            {isDecimalsLoading ? (
              <div className="spinner"></div>
            ) : (
              decimals?.toString() || '18'
            )}
          </span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Dirección:</span>
          <span className="detail-value address-value">
            {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : 'No conectada'}
          </span>
        </div>
      </div>

      {/* Estado del balance */}
      <div className="balance-status">
        {balance && balance.value > 0n ? (
          <div className="status-item positive">
            <span className="status-icon">✅</span>
            <span>Tienes tokens disponibles</span>
          </div>
        ) : (
          <div className="status-item neutral">
            <span className="status-icon">ℹ️</span>
            <span>No tienes tokens aún. ¡Reclama algunos del faucet!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenBalance;