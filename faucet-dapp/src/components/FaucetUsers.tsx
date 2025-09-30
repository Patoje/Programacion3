import { useState } from 'react';
import { useBackendFaucet } from '../hooks/useBackendFaucet';

/**
 * Componente para mostrar la lista de usuarios que han interactuado con el faucet
 * Ahora obtiene los datos del backend en lugar de interactuar directamente con el contrato
 */
export function FaucetUsers() {
  const { users, usersLoading, usersError, fetchUsers } = useBackendFaucet();
  const [showAll, setShowAll] = useState(false);

  // Función para truncar direcciones
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  /**
   * Maneja la actualización manual de la lista de usuarios
   */
  const handleRefreshUsers = () => {
    fetchUsers();
  };

  // Mostrar solo los primeros 5 usuarios por defecto
  const displayUsers = showAll ? users : users?.slice(0, 5) || [];

  if (usersLoading) {
    return (
      <div className="users-card">
        <div className="card-header">
          <h3>👥 Usuarios del Faucet</h3>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="users-card">
        <div className="card-header">
          <h3>👥 Usuarios del Faucet</h3>
          <button 
            className="refresh-button" 
            onClick={handleRefreshUsers}
            title="Reintentar"
          >
            🔄
          </button>
        </div>
        <div className="error-state">
          <span>❌</span>
          <div>
            <strong>Error al cargar usuarios</strong>
            <br />
            <small>{usersError}</small>
            <br />
            <button 
              onClick={handleRefreshUsers}
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
    <div className="users-card">
      <div className="card-header">
        <h3>👥 Usuarios del Faucet</h3>
        <span className="users-count">
          {users?.length || 0} usuarios
        </span>
      </div>
      
      <div className="users-content">
        {!users || users.length === 0 ? (
          <div className="empty-state">
            <p>🔍 Aún no hay usuarios registrados</p>
            <small>Sé el primero en reclamar tokens del faucet</small>
          </div>
        ) : (
          <>
            <div className="users-list">
              {displayUsers?.map((address: string, index: number) => (
                <div key={address} className="user-item">
                  <div className="user-info">
                    <span className="user-number">#{index + 1}</span>
                    <span className="user-address">{truncateAddress(address)}</span>
                  </div>
                  <div className="user-status">
                    <span className="status-badge claimed">✅ Reclamado</span>
                  </div>
                </div>
              ))}
            </div>
            
            {users && users.length > 5 && (
              <button 
                className="show-more-button"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Mostrar menos' : `Ver todos (${users.length})`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Información adicional */}
      <div className="card-footer">
        <div className="stats-info">
          <div className="stat-item">
            <span className="stat-label">Fuente</span>
            <span className="stat-value">Backend API</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total</span>
            <span className="stat-value">{users?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}