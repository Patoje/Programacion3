import { useFaucetUsers } from '../hooks/useFaucetToken'
import { useState } from 'react'

/**
 * Componente para mostrar la lista de usuarios que han interactuado con el faucet
 */
export function FaucetUsers() {
  const { data: users, isLoading, error } = useFaucetUsers()
  const [showAll, setShowAll] = useState(false)

  // Función para truncar direcciones
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Mostrar solo los primeros 5 usuarios por defecto
  const displayUsers = showAll ? users : users?.slice(0, 5) || []

  if (isLoading) {
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
    )
  }

  if (error) {
    return (
      <div className="users-card">
        <div className="card-header">
          <h3>👥 Usuarios del Faucet</h3>
        </div>
        <div className="error-state">
          <p>❌ Error al cargar usuarios</p>
        </div>
      </div>
    )
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
    </div>
  )
}