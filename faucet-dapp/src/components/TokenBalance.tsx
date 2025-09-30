import React from 'react';
import { useAccount } from 'wagmi';
import { useAuth } from '../hooks/useAuth';
import { useBackendFaucet } from '../hooks/useBackendFaucet';

/**
 * Componente para mostrar el balance de tokens del usuario usando el backend
 * Requiere autenticación SIWE para mostrar información completa
 */
const TokenBalance: React.FC = () => {
  const { isConnected } = useAccount();
  const { isAuthenticated } = useAuth();
  const { balance, statusLoading, statusError, fetchFaucetStatus } = useBackendFaucet();

  /**
   * Maneja la actualización manual del balance
   */
  const handleRefreshBalance = () => {
    if (isAuthenticated) {
      fetchFaucetStatus();
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

  // Si no está autenticado, mostrar mensaje de autenticación
  if (!isAuthenticated) {
    return (
      <div className="balance-card">
        <div className="card-header">
          <h3>💰 Balance de Tokens</h3>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🔐</div>
          <h4>Autenticación Requerida</h4>
          <p>Debes autenticarte con SIWE para ver tu balance</p>
        </div>
      </div>
    );
  }

  // Manejar errores de balance
  if (statusError) {
    return (
      <div className="balance-card">
        <div className="card-header">
          <h3>💰 Balance de Tokens</h3>
          <button 
            className="refresh-button" 
            onClick={handleRefreshBalance}
            title="Reintentar"
          >
            🔄
          </button>
        </div>
        <div className="error-state">
          <span>❌</span>
          <div>
            <strong>Error al cargar balance</strong>
            <br />
            <small>{statusError}</small>
            <br />
            <button 
              onClick={handleRefreshBalance}
              style={{ 
                marginTop: '0.5rem',
                padding: '0.25rem 0.5rem',
                fontSize: '0.8rem',
                background: 'transparent',
                border: '1px solid currentColor',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reintentar
            </button>
          </div>
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
          disabled={statusLoading}
          title="Actualizar balance"
        >
          {statusLoading ? '🔄' : '↻'}
        </button>
      </div>

      {/* Información del token */}
      <div className="token-info-section">
        <div className="token-header">
          <div className="token-icon">🪙</div>
          <div className="token-details">
            <h4 className="token-name">FaucetToken (Demo)</h4>
            <p className="token-symbol">FTKN</p>
          </div>
        </div>
      </div>

      {/* Balance principal */}
      <div className="balance-main">
        {statusLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando balance...</p>
          </div>
        ) : (
          <div className="balance-display">
            <div className="balance-amount">
              {balance || '0'}
            </div>
            <div className="balance-symbol">FTKN</div>
          </div>
        )}
      </div>

      {/* Información detallada */}
      <div className="balance-details">
        <div className="detail-item">
          <span className="detail-label">Balance:</span>
          <span className="detail-value">
            {statusLoading ? (
              <div className="spinner"></div>
            ) : (
              `${balance || '0'} FTKN`
            )}
          </span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Decimales:</span>
          <span className="detail-value">18</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Símbolo:</span>
          <span className="detail-value">FTKN</span>
        </div>
      </div>

      {/* Estado del balance */}
      <div className="balance-status">
        <div className={`status-item ${balance && parseFloat(balance) > 0 ? 'positive' : 'neutral'}`}>
          <span className="status-icon">
            {balance && parseFloat(balance) > 0 ? '✅' : 'ℹ️'}
          </span>
          <span>
            {balance && parseFloat(balance) > 0 
              ? 'Tienes tokens en tu wallet' 
              : 'No tienes tokens aún'
            }
          </span>
        </div>
      </div>

      {/* Información adicional */}
      <div className="card-footer">
        <div className="stats-info">
          <div className="stat-item">
            <span className="stat-label">Fuente</span>
            <span className="stat-value">Backend API</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Red</span>
            <span className="stat-value">Sepolia (Demo)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenBalance;