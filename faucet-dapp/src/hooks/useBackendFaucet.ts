import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { apiService } from '../services/api';
import type { FaucetStatusResponse, ClaimResponse, UsersResponse } from '../services/api';
import { useAuth } from './useAuth';

/**
 * Estados posibles para las operaciones del faucet
 */
export type FaucetOperationStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Hook personalizado para manejar operaciones del faucet a través del backend
 */
export function useBackendFaucet() {
  const { address } = useAccount();
  const { isAuthenticated } = useAuth();

  // Estados para el estado del faucet
  const [faucetStatus, setFaucetStatus] = useState<FaucetStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string>('');

  // Estados para el reclamo de tokens
  const [claimStatus, setClaimStatus] = useState<FaucetOperationStatus>('idle');
  const [claimResult, setClaimResult] = useState<ClaimResponse | null>(null);
  const [claimError, setClaimError] = useState<string>('');

  // Estados para la lista de usuarios
  const [users, setUsers] = useState<string[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string>('');

  /**
   * Obtiene el estado del faucet para la dirección actual
   */
  const fetchFaucetStatus = useCallback(async (): Promise<void> => {
    if (!address || !isAuthenticated) {
      setFaucetStatus(null);
      return;
    }

    try {
      setStatusLoading(true);
      setStatusError('');

      const status = await apiService.getFaucetStatus(address);
      setFaucetStatus(status);

      console.log('Estado del faucet obtenido:', status);
    } catch (error: any) {
      console.error('Error obteniendo estado del faucet:', error);
      setStatusError(error.message || 'Error al obtener estado del faucet');
      setFaucetStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, [address, isAuthenticated]);

  /**
   * Reclama tokens del faucet
   */
  const claimTokens = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      setClaimError('Debes autenticarte primero');
      return false;
    }

    try {
      setClaimStatus('loading');
      setClaimError('');
      setClaimResult(null);

      console.log('Iniciando reclamo de tokens...');
      const result = await apiService.claimTokens();
      
      setClaimResult(result);
      setClaimStatus('success');

      // Actualizar estado del faucet después del reclamo exitoso
      setTimeout(() => {
        fetchFaucetStatus();
        fetchUsers();
      }, 1000);

      console.log('Reclamo exitoso:', result);
      return true;

    } catch (error: any) {
      console.error('Error reclamando tokens:', error);
      
      let errorMessage = 'Error al reclamar tokens';
      if (error.message.includes('Ya reclamado')) {
        errorMessage = 'Ya has reclamado tokens anteriormente';
      } else if (error.message.includes('Fondos insuficientes')) {
        errorMessage = 'El faucet no tiene fondos suficientes';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setClaimError(errorMessage);
      setClaimStatus('error');
      return false;
    }
  }, [isAuthenticated, fetchFaucetStatus]);

  /**
   * Obtiene la lista de usuarios del faucet
   */
  const fetchUsers = useCallback(async (): Promise<void> => {
    try {
      setUsersLoading(true);
      setUsersError('');

      const response = await apiService.getFaucetUsers();
      setUsers(response.users);

      console.log(`Lista de usuarios obtenida: ${response.count} usuarios`);
    } catch (error: any) {
      console.error('Error obteniendo usuarios:', error);
      setUsersError(error.message || 'Error al obtener lista de usuarios');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  /**
   * Resetea el estado de reclamo
   */
  const resetClaimStatus = useCallback(() => {
    setClaimStatus('idle');
    setClaimError('');
    setClaimResult(null);
  }, []);

  /**
   * Resetea errores
   */
  const clearErrors = useCallback(() => {
    setStatusError('');
    setClaimError('');
    setUsersError('');
  }, []);

  /**
   * Efecto para cargar datos iniciales cuando el usuario se autentica
   */
  useEffect(() => {
    if (isAuthenticated && address) {
      console.log('Usuario autenticado, cargando datos del faucet...');
      fetchFaucetStatus();
      fetchUsers();
    } else {
      // Limpiar datos cuando no está autenticado
      console.log('Usuario no autenticado, limpiando datos...');
      setFaucetStatus(null);
      setUsers([]);
      resetClaimStatus();
      clearErrors();
    }
  }, [isAuthenticated, address, fetchFaucetStatus, fetchUsers, resetClaimStatus, clearErrors]);

  /**
   * Efecto adicional para forzar actualización cuando cambia el estado de autenticación
   */
  useEffect(() => {
    if (isAuthenticated && address) {
      // Pequeño delay para asegurar que la autenticación se haya completado
      const timer = setTimeout(() => {
        console.log('Forzando actualización después de autenticación...');
        fetchFaucetStatus();
        fetchUsers();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  /**
   * Efecto para limpiar errores después de un tiempo
   */
  useEffect(() => {
    const errors = [statusError, claimError, usersError].filter(Boolean);
    if (errors.length > 0) {
      const timer = setTimeout(() => {
        clearErrors();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [statusError, claimError, usersError, clearErrors]);

  return {
    // Estado del faucet
    faucetStatus,
    statusLoading,
    statusError,
    
    // Información derivada del estado
    hasClaimed: faucetStatus?.hasClaimed || false,
    balance: faucetStatus?.balance || '0',
    faucetAmount: faucetStatus?.faucetAmount || '1000000',
    
    // Reclamo de tokens
    claimStatus,
    claimResult,
    claimError,
    isClaimLoading: claimStatus === 'loading',
    
    // Lista de usuarios
    users,
    usersLoading,
    usersError,
    usersCount: users.length,
    
    // Acciones
    claimTokens,
    fetchFaucetStatus,
    fetchUsers,
    resetClaimStatus,
    clearErrors,
    
    // Estados de loading generales
    isLoading: statusLoading || usersLoading,
    hasError: Boolean(statusError || claimError || usersError),
  };
}