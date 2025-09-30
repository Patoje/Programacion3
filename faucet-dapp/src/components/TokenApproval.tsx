import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, isAddress } from 'viem';
import { formatTokenAmount } from '../hooks/useFaucetToken';

/**
 * Componente para aprobar que otra dirección gaste tokens en nombre del usuario
 * Incluye validaciones, estados de carga y visualización de allowances actuales
 */
const TokenApproval: React.FC = () => {
  // Estados del componente
  const [spender, setSpender] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Hooks de wagmi
  const { address, isConnected } = useAccount();
  
  // Hook para escribir al contrato (approve)
  const { 
    writeContract, 
    data: hash, 
    isPending: isWriting,
    error: writeError 
  } = useWriteContract();

  // Hook para esperar confirmación de transacción
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError 
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Hook para leer el allowance actual
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5C',
    abi: [
      {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ],
    functionName: 'allowance',
    args: address && spender && isAddress(spender) ? [address, spender as `0x${string}`] : undefined,
    query: {
      enabled: !!(address && spender && isAddress(spender))
    }
  });

  /**
   * Valida la dirección del spender
   */
  const validateSpender = (address: string): boolean => {
    if (!address) return false;
    return isAddress(address);
  };

  /**
   * Valida la cantidad a aprobar
   */
  const validateAmount = (amount: string): boolean => {
    if (!amount || isNaN(Number(amount))) return false;
    const numAmount = Number(amount);
    return numAmount >= 0; // Permitir 0 para revocar aprobación
  };

  /**
   * Maneja el envío del formulario de aprobación
   */
  const handleApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validaciones
    if (!validateSpender(spender)) {
      setError('Por favor ingresa una dirección válida');
      return;
    }

    if (!validateAmount(amount)) {
      setError('Por favor ingresa una cantidad válida');
      return;
    }

    if (spender.toLowerCase() === address?.toLowerCase()) {
      setError('No puedes aprobar a tu propia dirección');
      return;
    }

    try {
      // Ejecutar aprobación
      await writeContract({
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5C',
        abi: [
          {
            name: 'approve',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ],
        functionName: 'approve',
        args: [spender as `0x${string}`, parseEther(amount)]
      });
    } catch (err) {
      console.error('Error en aprobación:', err);
      setError('Error al ejecutar la aprobación');
    }
  };

  /**
   * Revoca toda la aprobación (establece allowance a 0)
   */
  const handleRevoke = async () => {
    if (!spender || !validateSpender(spender)) {
      setError('Ingresa una dirección válida primero');
      return;
    }

    setAmount('0');
    
    try {
      await writeContract({
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5C',
        abi: [
          {
            name: 'approve',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ],
        functionName: 'approve',
        args: [spender as `0x${string}`, 0n]
      });
    } catch (err) {
      console.error('Error revocando aprobación:', err);
      setError('Error al revocar la aprobación');
    }
  };

  /**
   * Limpia el formulario y actualiza allowance después de una aprobación exitosa
   */
  React.useEffect(() => {
    if (isConfirmed) {
      setSuccess(`¡Aprobación exitosa! Hash: ${hash}`);
      refetchAllowance(); // Actualizar allowance actual
    }
  }, [isConfirmed, hash, refetchAllowance]);

  /**
   * Maneja errores de escritura y confirmación
   */
  React.useEffect(() => {
    if (writeError) {
      setError(`Error de transacción: ${writeError.message}`);
    }
    if (confirmError) {
      setError(`Error de confirmación: ${confirmError.message}`);
    }
  }, [writeError, confirmError]);

  // Si no está conectado, mostrar mensaje
  if (!isConnected) {
    return (
      <div className="approval-card">
        <div className="card-header">
          <h3>✅ Aprobar Tokens</h3>
        </div>
        <div className="empty-state">
          <span className="empty-icon">🔗</span>
          <h4>Wallet no conectada</h4>
          <p>Conecta tu wallet para gestionar aprobaciones</p>
        </div>
      </div>
    );
  }

  const isLoading = isWriting || isConfirming;
  const formattedAllowance = currentAllowance ? formatTokenAmount(currentAllowance) : '0';

  return (
    <div className="approval-card">
      <div className="card-header">
        <h3>✅ Aprobar Tokens</h3>
      </div>

      <form onSubmit={handleApproval} className="approval-form">
        {/* Campo de dirección del spender */}
        <div className="form-group">
          <label htmlFor="spender" className="form-label">
            Dirección autorizada (Spender)
          </label>
          <input
            id="spender"
            type="text"
            value={spender}
            onChange={(e) => setSpender(e.target.value)}
            placeholder="0x..."
            className={`form-input ${spender && !validateSpender(spender) ? 'error' : ''}`}
            disabled={isLoading}
          />
          {spender && !validateSpender(spender) && (
            <span className="field-error">Dirección inválida</span>
          )}
        </div>

        {/* Mostrar allowance actual si hay spender válido */}
        {spender && validateSpender(spender) && (
          <div className="current-allowance">
            <div className="allowance-info">
              <span className="allowance-label">Allowance actual:</span>
              <span className="allowance-value">{formattedAllowance} FT</span>
            </div>
            {Number(formattedAllowance) > 0 && (
              <button
                type="button"
                onClick={handleRevoke}
                className="revoke-button"
                disabled={isLoading}
              >
                🚫 Revocar aprobación
              </button>
            )}
          </div>
        )}

        {/* Campo de cantidad */}
        <div className="form-group">
          <label htmlFor="amount" className="form-label">
            Cantidad a aprobar (FT)
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.000001"
            min="0"
            className={`form-input ${amount && !validateAmount(amount) ? 'error' : ''}`}
            disabled={isLoading}
          />
          {amount && !validateAmount(amount) && (
            <span className="field-error">Cantidad inválida</span>
          )}
          <div className="amount-helpers">
            <button
              type="button"
              onClick={() => setAmount('1000000')}
              className="helper-button"
              disabled={isLoading}
            >
              1M FT
            </button>
            <button
              type="button"
              onClick={() => setAmount('0')}
              className="helper-button"
              disabled={isLoading}
            >
              Revocar (0)
            </button>
          </div>
        </div>

        {/* Botón de aprobación */}
        <button
          type="submit"
          disabled={
            isLoading || 
            !validateSpender(spender) || 
            !validateAmount(amount)
          }
          className={`approval-button ${isLoading ? 'loading' : 'ready'}`}
        >
          {isLoading ? (
            <>
              <div className="loading-spinner" />
              {isWriting ? 'Aprobando...' : 'Confirmando...'}
            </>
          ) : (
            <>
              <span>✅</span>
              {Number(amount) === 0 ? 'Revocar Aprobación' : 'Aprobar Tokens'}
            </>
          )}
        </button>
      </form>

      {/* Información de la transacción */}
      {hash && (
        <div className="transaction-info">
          <div className="transaction-item">
            <span className="transaction-label">Hash de transacción:</span>
            <span className="transaction-value">{hash.slice(0, 10)}...{hash.slice(-8)}</span>
          </div>
          <div className="transaction-item">
            <span className="transaction-label">Estado:</span>
            <span className={`transaction-status ${isConfirmed ? 'confirmed' : 'pending'}`}>
              {isConfirmed ? '✅ Confirmada' : '⏳ Pendiente'}
            </span>
          </div>
        </div>
      )}

      {/* Mensajes de error y éxito */}
      {error && (
        <div className="error-message">
          <span>⚠️</span>
          <div>
            <h4>Error en la aprobación</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="success-message">
          <span>✅</span>
          <div>
            <h4>¡Aprobación exitosa!</h4>
            <p>La aprobación ha sido procesada correctamente</p>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="approval-info">
        <div className="info-item">
          <span className="info-icon">ℹ️</span>
          <div className="info-content">
            <h5>¿Qué es una aprobación?</h5>
            <ul>
              <li>Permite que otra dirección gaste tus tokens</li>
              <li>Útil para contratos inteligentes (DEX, lending, etc.)</li>
              <li>Puedes revocar la aprobación en cualquier momento</li>
              <li>Solo aprueba la cantidad que necesites</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenApproval;