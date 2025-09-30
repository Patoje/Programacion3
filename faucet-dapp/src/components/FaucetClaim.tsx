import React from 'react';
import { useAccount } from 'wagmi';
import { useAuth } from '../hooks/useAuth';
import { useBackendFaucet } from '../hooks/useBackendFaucet';
import AuthButton from './AuthButton';

/**
 * Componente para reclamar tokens del faucet usando el backend
 * Requiere autenticación SIWE antes de permitir el reclamo
 */
const FaucetClaim: React.FC = () => {
  const { isConnected } = useAccount();
  const { isAuthenticated } = useAuth();
  const { 
    hasClaimed,
    balance,
    faucetAmount,
    claimStatus,
    claimResult,
    claimError,
    isClaimLoading,
    claimTokens,
    resetClaimStatus
  } = useBackendFaucet();

  /**
   * Maneja el proceso de reclamo de tokens
   */
  const handleClaimTokens = async () => {
    if (!isAuthenticated || hasClaimed || isClaimLoading) return;
    await claimTokens();
  };

  /**
   * Determina el estado del botón de reclamo
   */
  const getClaimButtonState = () => {
    if (!isConnected) return 'disconnected';
    if (!isAuthenticated) return 'not-authenticated';
    if (isClaimLoading) return 'loading';
    if (hasClaimed) return 'already-claimed';
    if (claimStatus === 'success') return 'success';
    return 'ready';
  };

  const buttonState = getClaimButtonState();

  return (
    <div className="claim-card">
      <div className="card-header">
        <h3>🪙 Reclamar Tokens</h3>
        {isAuthenticated && hasClaimed && (
          <span className="status-badge claimed">✅ Ya reclamado</span>
        )}
      </div>

      {/* Mostrar autenticación si no está conectado o autenticado */}
      {(!isConnected || !isAuthenticated) && (
        <div className="auth-required-section">
          <AuthButton />
        </div>
      )}

      {/* Contenido principal - solo visible si está autenticado */}
      {isAuthenticated && (
        <>
          {/* Información del balance y faucet */}
          <div className="balance-section">
            <div className="balance-item">
              <span className="balance-label">Tu Balance Actual:</span>
              <span className="balance-value">
                {balance} FTKN
              </span>
            </div>
            
            <div className="balance-item">
              <span className="balance-label">Cantidad por Reclamo:</span>
              <span className="balance-value">
                {faucetAmount} FTKN
              </span>
            </div>
          </div>

          <div className="claim-section">
            {/* Botón de reclamo */}
            <button
              className={`claim-button ${buttonState}`}
              onClick={handleClaimTokens}
              disabled={buttonState !== 'ready'}
            >
              {buttonState === 'loading' && <div className="loading-spinner"></div>}
              {buttonState === 'ready' && '🎁 Reclamar Tokens'}
              {buttonState === 'already-claimed' && '✅ Ya Reclamado'}
              {buttonState === 'success' && '🎉 ¡Reclamo Exitoso!'}
              {buttonState === 'not-authenticated' && '🔐 Autenticación Requerida'}
              {buttonState === 'disconnected' && '🔗 Conectar Wallet'}
            </button>

            {/* Mensajes de estado */}
            {claimStatus === 'success' && claimResult && (
              <div className="success-message">
                <span>🎉</span>
                <div>
                  <strong>¡Tokens reclamados exitosamente!</strong>
                  <br />
                  <small>TX Hash: {claimResult.txHash}</small>
                  <br />
                  Los tokens han sido transferidos a tu wallet.
                </div>
              </div>
            )}

            {claimStatus === 'error' && claimError && (
              <div className="error-message">
                <span>❌</span>
                <div>
                  <strong>Error al reclamar tokens:</strong>
                  <br />
                  {claimError}
                  <button 
                    onClick={resetClaimStatus}
                    style={{ 
                      marginLeft: '1rem', 
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
            )}

            {hasClaimed && (
              <div className="success-message">
                <span>ℹ️</span>
                <div>
                  <strong>Ya has reclamado tus tokens</strong>
                  <br />
                  Solo puedes reclamar tokens una vez por dirección.
                </div>
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className="card-footer">
            <div className="stats-info">
              <div className="stat-item">
                <span className="stat-label">Estado</span>
                <span className="stat-value">
                  {hasClaimed ? 'Reclamado' : 'Disponible'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Modo</span>
                <span className="stat-value">Backend API</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FaucetClaim;