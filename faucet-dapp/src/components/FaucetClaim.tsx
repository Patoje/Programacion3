import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useClaimTokens, useTokenBalance, useHasAddressClaimed, useFaucetAmount } from '../hooks/useFaucetToken';

/**
 * Componente para reclamar tokens del faucet
 * Permite a los usuarios conectados reclamar tokens una sola vez
 */
const FaucetClaim: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [claimStatus, setClaimStatus] = useState<'idle' | 'claiming' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Hooks para interactuar con el contrato
  const { claimTokens, isPending: isClaimLoading, error: claimError } = useClaimTokens();
  const { data: balance, isLoading: isBalanceLoading, refetch: refetchBalance } = useTokenBalance(address);
  const { data: hasClaimed, isLoading: isClaimedLoading, refetch: refetchClaimed } = useHasAddressClaimed(address);
  const { data: faucetAmount, isLoading: isFaucetAmountLoading } = useFaucetAmount();

  // Efecto para manejar errores de reclamo
  useEffect(() => {
    if (claimError) {
      setClaimStatus('error');
      setErrorMessage(claimError.message || 'Error al reclamar tokens');
    }
  }, [claimError]);

  /**
   * Maneja el proceso de reclamo de tokens
   */
  const handleClaimTokens = async () => {
    if (!isConnected || !address || hasClaimed) return;

    try {
      setClaimStatus('claiming');
      setErrorMessage('');
      
      await claimTokens();
      
      setClaimStatus('success');
      
      // Actualizar datos después del reclamo exitoso
      setTimeout(() => {
        refetchBalance();
        refetchClaimed();
      }, 2000);
      
    } catch (error: any) {
      setClaimStatus('error');
      setErrorMessage(error?.message || 'Error inesperado al reclamar tokens');
    }
  };

  /**
   * Resetea el estado de reclamo
   */
  const resetClaimStatus = () => {
    setClaimStatus('idle');
    setErrorMessage('');
  };

  // Determinar el estado del botón de reclamo
  const getClaimButtonState = () => {
    if (!isConnected) return 'disconnected';
    if (hasClaimed) return 'already-claimed';
    if (isClaimLoading || claimStatus === 'claiming') return 'loading';
    if (claimStatus === 'success') return 'success';
    return 'ready';
  };

  const buttonState = getClaimButtonState();

  // Renderizar contenido basado en el estado de conexión
  if (!isConnected) {
    return (
      <div className="claim-card">
        <div className="card-header">
          <h3>🪙 Reclamar Tokens</h3>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <h4>Conecta tu Wallet</h4>
          <p>Necesitas conectar tu wallet para reclamar tokens del faucet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="claim-card">
      <div className="card-header">
        <h3>🪙 Reclamar Tokens</h3>
        {!isClaimedLoading && hasClaimed && (
          <span className="status-badge claimed">✅ Ya reclamado</span>
        )}
      </div>

      {/* Información del balance y faucet */}
      <div className="balance-section">
        <div className="balance-item">
          <span className="balance-label">Tu Balance Actual:</span>
          <span className="balance-value">
            {isBalanceLoading ? (
              <div className="spinner"></div>
            ) : (
              `${balance?.formatted || '0'} FTKN`
            )}
          </span>
        </div>
        
        <div className="balance-item">
          <span className="balance-label">Cantidad por Reclamo:</span>
          <span className="balance-value">
            {isFaucetAmountLoading ? (
              <div className="spinner"></div>
            ) : (
              `${faucetAmount?.formatted || '1,000,000'} FTKN`
            )}
          </span>
        </div>
      </div>

      {/* Estado de verificación */}
      {isClaimedLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Verificando estado de reclamo...</p>
        </div>
      ) : (
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
            {buttonState === 'disconnected' && '🔗 Conectar Wallet'}
          </button>

          {/* Mensajes de estado */}
          {claimStatus === 'success' && (
            <div className="success-message">
              <span>🎉</span>
              <div>
                <strong>¡Tokens reclamados exitosamente!</strong>
                <br />
                Los tokens han sido transferidos a tu wallet.
              </div>
            </div>
          )}

          {claimStatus === 'error' && errorMessage && (
            <div className="error-message">
              <span>❌</span>
              <div>
                <strong>Error al reclamar tokens:</strong>
                <br />
                {errorMessage}
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
      )}

      {/* Información adicional */}
      <div className="card-footer">
        <div className="stats-info">
          <div className="stat-item">
            <span className="stat-label">Estado</span>
            <span className="stat-value">
              {isClaimedLoading ? 'Verificando...' : hasClaimed ? 'Reclamado' : 'Disponible'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Dirección</span>
            <span className="stat-value">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'No conectada'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaucetClaim;