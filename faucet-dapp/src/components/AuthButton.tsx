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
    if (isAuthenticated) {
      logout();
    } else {
      await authenticate();
    }
  };

  /**
   * Obtiene el texto del botón según el estado
   */
  const getButtonText = (): string => {
    if (!isConnected) return '🔗 Conecta tu Wallet';
    if (isAuthenticated) return '🔓 Cerrar Sesión';
    
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
    if (isAuthenticated) return `${baseClass} authenticated`;
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
      {/* Botón principal de autenticación */}
      <button
        className={getButtonClass()}
        onClick={handleAuthClick}
        disabled={isLoading || !isConnected}
      >
        {isLoading && <div className="loading-spinner"></div>}
        {getButtonText()}
      </button>

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
          <p>Por favor, firma el mensaje en tu wallet</p>
        </div>
      )}

      {authStatus === 'authenticating' && (
        <div className="auth-status info">
          <span>🔐</span>
          <p>Verificando firma con el servidor...</p>
        </div>
      )}

      {isAuthenticated && (
        <div className="auth-status success">
          <span>✅</span>
          <p>Autenticado correctamente</p>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="auth-status error">
          <span>❌</span>
          <div>
            <strong>Error de autenticación:</strong>
            <br />
            {error}
            <button 
              onClick={clearError}
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
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Información sobre SIWE */}
      {!isAuthenticated && !isLoading && !error && (
        <div className="auth-info">
          <h4>🔐 Sign-In with Ethereum</h4>
          <p>
            Para acceder a las funciones del faucet, necesitas autenticarte 
            firmando un mensaje con tu wallet. Esto es seguro y no cuesta gas.
          </p>
          <ul>
            <li>✅ No requiere transacciones</li>
            <li>✅ Sin costo de gas</li>
            <li>✅ Completamente seguro</li>
            <li>✅ Estándar de la industria</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default AuthButton;