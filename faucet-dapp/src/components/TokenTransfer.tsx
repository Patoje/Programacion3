import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, isAddress } from 'viem';
import { useTokenBalance, formatTokenAmount } from '../hooks/useFaucetToken';

/**
 * Componente para transferir tokens ERC20 a otra dirección
 * Incluye validaciones de entrada, estados de carga y manejo de errores
 */
const TokenTransfer: React.FC = () => {
  // Estados del componente
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Hooks de wagmi
  const { address, isConnected } = useAccount();
  const { data: balance } = useTokenBalance(address);
  
  // Hook para escribir al contrato
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

  /**
   * Valida la dirección del destinatario
   */
  const validateRecipient = (address: string): boolean => {
    if (!address) return false;
    return isAddress(address);
  };

  /**
   * Valida la cantidad a transferir
   */
  const validateAmount = (amount: string): boolean => {
    if (!amount || isNaN(Number(amount))) return false;
    const numAmount = Number(amount);
    return numAmount > 0 && numAmount <= Number(formatTokenAmount(balance || 0n));
  };

  /**
   * Maneja el envío del formulario de transferencia
   */
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validaciones
    if (!validateRecipient(recipient)) {
      setError('Por favor ingresa una dirección válida');
      return;
    }

    if (!validateAmount(amount)) {
      setError('Por favor ingresa una cantidad válida');
      return;
    }

    if (recipient.toLowerCase() === address?.toLowerCase()) {
      setError('No puedes transferir tokens a tu propia dirección');
      return;
    }

    try {
      // Ejecutar transferencia
      await writeContract({
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5C',
        abi: [
          {
            name: 'transfer',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ],
        functionName: 'transfer',
        args: [recipient as `0x${string}`, parseEther(amount)]
      });
    } catch (err) {
      console.error('Error en transferencia:', err);
      setError('Error al ejecutar la transferencia');
    }
  };

  /**
   * Limpia el formulario después de una transferencia exitosa
   */
  React.useEffect(() => {
    if (isConfirmed) {
      setSuccess(`¡Transferencia exitosa! Hash: ${hash}`);
      setRecipient('');
      setAmount('');
    }
  }, [isConfirmed, hash]);

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
      <div className="transfer-card">
        <div className="card-header">
          <h3>💸 Transferir Tokens</h3>
        </div>
        <div className="empty-state">
          <span className="empty-icon">🔗</span>
          <h4>Wallet no conectada</h4>
          <p>Conecta tu wallet para transferir tokens</p>
        </div>
      </div>
    );
  }

  const isLoading = isWriting || isConfirming;
  const userBalance = formatTokenAmount(balance || 0n);

  return (
    <div className="transfer-card">
      <div className="card-header">
        <h3>💸 Transferir Tokens</h3>
        <div className="balance-info">
          <span className="balance-label">Balance:</span>
          <span className="balance-value">{userBalance} FT</span>
        </div>
      </div>

      <form onSubmit={handleTransfer} className="transfer-form">
        {/* Campo de dirección del destinatario */}
        <div className="form-group">
          <label htmlFor="recipient" className="form-label">
            Dirección del destinatario
          </label>
          <input
            id="recipient"
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className={`form-input ${recipient && !validateRecipient(recipient) ? 'error' : ''}`}
            disabled={isLoading}
          />
          {recipient && !validateRecipient(recipient) && (
            <span className="field-error">Dirección inválida</span>
          )}
        </div>

        {/* Campo de cantidad */}
        <div className="form-group">
          <label htmlFor="amount" className="form-label">
            Cantidad (FT)
          </label>
          <div className="amount-input-container">
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.000001"
              min="0"
              max={userBalance}
              className={`form-input ${amount && !validateAmount(amount) ? 'error' : ''}`}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setAmount(userBalance)}
              className="max-button"
              disabled={isLoading || !balance}
            >
              MAX
            </button>
          </div>
          {amount && !validateAmount(amount) && (
            <span className="field-error">
              Cantidad inválida o insuficiente balance
            </span>
          )}
        </div>

        {/* Botón de transferencia */}
        <button
          type="submit"
          disabled={
            isLoading || 
            !validateRecipient(recipient) || 
            !validateAmount(amount) ||
            !balance ||
            Number(balance) === 0
          }
          className={`transfer-button ${isLoading ? 'loading' : 'ready'}`}
        >
          {isLoading ? (
            <>
              <div className="loading-spinner" />
              {isWriting ? 'Enviando...' : 'Confirmando...'}
            </>
          ) : (
            <>
              <span>💸</span>
              Transferir Tokens
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
            <h4>Error en la transferencia</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="success-message">
          <span>✅</span>
          <div>
            <h4>¡Transferencia exitosa!</h4>
            <p>Los tokens han sido transferidos correctamente</p>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="transfer-info">
        <div className="info-item">
          <span className="info-icon">ℹ️</span>
          <div className="info-content">
            <h5>Información importante</h5>
            <ul>
              <li>Las transferencias son irreversibles</li>
              <li>Verifica la dirección del destinatario</li>
              <li>Se requiere gas para la transacción</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenTransfer;