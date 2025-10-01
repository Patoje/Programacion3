import { useState } from 'react';
import { useBackendFaucet } from '../hooks/useBackendFaucet';

/**
 * Componente simplificado para mostrar únicamente usuarios que reclamaron del faucet
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
          <h3>✅ Usuarios que reclamaron</h3>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="users-card">
        <div className="card-header">
          <h3>✅ Usuarios que reclamaron</h3>
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
            <strong>Error al cargar información</strong>
            <br />
            <small>{usersError}</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-card">
      <div className="card-header">
        <h3>✅ Usuarios que reclamaron</h3>
        <span className="users-count">
          {users?.length || 0} reclamaron
        </span>
      </div>
      
      <div className="users-content">
        {!users || users.length === 0 ? (
          <div className="empty-state">
            <p>🔍 Aún nadie ha reclamado</p>
            <small>Sé el primero en reclamar tokens</small>
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
    </div>
  );
}