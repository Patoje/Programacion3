import React from 'react';
import { useAccount } from 'wagmi';
import { useAuth } from '../hooks/useAuth';

/**
 * Componente para manejar la autenticación SIWE
 * Muestra diferentes estados según el estado de autenticación
 */
export function AuthButton() {
  const { isConnected } = useAccount();
  const { 
    authStatus, 
    isAuthenticated, 
    error, 
    isLoading,
    authenticate, 
    logout, 
    clearError 
  } = useAuth();

  /**
   * Maneja el click del botón de autenticación
   */
  const handleAuthClick = async () => {
    // Solo permitir autenticación si no está autenticado
    if (!isAuthenticated) {
      await authenticate();
    }
  };

  /**
   * Obtiene el texto del botón según el estado
   */
  const getButtonText = (): string => {
    if (!isConnected) return '🔗 Conecta tu Wallet';
    
    switch (authStatus) {
      case 'requesting':
        return '📝 Generando mensaje...';
      case 'signing':
        return '✍️ Firma el mensaje';
      case 'authenticating':
        return '🔐 Autenticando...';
      case 'error':
        return '🔄 Reintentar';
      default:
        return '🔐 Autenticarse';
    }
  };

  /**
   * Obtiene la clase CSS del botón según el estado
   */
  const getButtonClass = (): string => {
    const baseClass = 'auth-button';
    
    if (!isConnected) return `${baseClass} disabled`;
    if (isLoading) return `${baseClass} loading`;
    if (authStatus === 'error') return `${baseClass} error`;
    
    return `${baseClass} ready`;
  };

  // No mostrar si no hay wallet conectada
  if (!isConnected) {
    return (
      <div className="auth-section">
        <div className="auth-info">
          <span className="auth-icon">🔗</span>
          <p>Conecta tu wallet para continuar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-section">
      {/* Solo mostrar el botón si no está autenticado */}
      {!isAuthenticated && (
        <button
          className={getButtonClass()}
          onClick={handleAuthClick}
          disabled={isLoading || !isConnected}
        >
          {isLoading && <div className="loading-spinner"></div>}
          {getButtonText()}
        </button>
      )}

      {/* Mensaje de estado */}
      {authStatus === 'requesting' && (
        <div className="auth-status info">
          <span>📝</span>
          <p>Generando mensaje de autenticación...</p>
        </div>
      )}

      {authStatus === 'signing' && (
        <div className="auth-status info">
          <span>✍️</span>
          <p>Firma el mensaje en tu wallet para continuar</p>
        </div>
      )}

      {authStatus === 'authenticating' && (
        <div className="auth-status info">
          <span>🔐</span>
          <p>Verificando autenticación...</p>
        </div>
      )}

      {authStatus === 'authenticated' && (
        <div className="auth-status success">
          <span>✅</span>
          <p>Autenticado correctamente</p>
        </div>
      )}

      {authStatus === 'error' && (
        <div className="auth-status error">
          <span>❌</span>
          <p>Error de autenticación. Inténtalo de nuevo.</p>
        </div>
      )}

      {/* Información sobre SIWE */}
      {!isAuthenticated && !isLoading && !error && (
        <div className="auth-info industrial-info">
          <div className="info-header">
            <span className="info-icon">🔐</span>
            <h4>Sign-In with Ethereum</h4>
          </div>
          <p>
            Autenticación descentralizada usando el estándar SIWE. 
            Firma un mensaje con tu wallet para acceder de forma segura.
          </p>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Sin costo de gas</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🛡️</span>
              <span>Completamente seguro</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🏭</span>
              <span>Estándar industrial</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🚀</span>
              <span>Tecnología avanzada</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuthButton;