import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { apiService } from '../services/api';

/**
 * Estados posibles de la autenticación
 */
export type AuthStatus = 'idle' | 'requesting' | 'signing' | 'authenticating' | 'authenticated' | 'error';

/**
 * Hook personalizado para manejar autenticación SIWE con el backend
 */
export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [error, setError] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Verifica si el usuario ya está autenticado al cargar el hook
   */
  useEffect(() => {
    const checkAuthStatus = () => {
      if (apiService.isAuthenticated()) {
        setIsAuthenticated(true);
        setAuthStatus('authenticated');
      } else {
        setIsAuthenticated(false);
        setAuthStatus('idle');
      }
    };

    checkAuthStatus();
  }, []);

  /**
   * Resetea el estado de autenticación cuando se desconecta la wallet
   */
  useEffect(() => {
    if (!isConnected) {
      handleLogout();
    }
  }, [isConnected]);

  /**
   * Limpia errores después de un tiempo
   */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  /**
   * Inicia el proceso de autenticación SIWE
   */
  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!address || !isConnected) {
      setError('Wallet no conectada');
      return false;
    }

    try {
      setAuthStatus('requesting');
      setError('');

      // 1. Solicitar mensaje SIWE al backend
      console.log('Solicitando mensaje SIWE para:', address);
      const messageResponse = await apiService.requestMessage(address);
      
      setAuthStatus('signing');

      // 2. Firmar el mensaje con la wallet
      console.log('Firmando mensaje SIWE...');
      console.log('Mensaje completo a firmar:', messageResponse.message);
      
      let signature: string;
      try {
        signature = await signMessageAsync({
          message: messageResponse.message
        });
        console.log('Firma obtenida exitosamente:', signature);
      } catch (signError: any) {
        console.error('Error al firmar mensaje:', signError);
        
        if (signError.message.includes('User rejected') || signError.code === 4001) {
          throw new Error('Firma cancelada por el usuario');
        }
        
        throw new Error(`Error al firmar: ${signError.message}`);
      }

      setAuthStatus('authenticating');

      // 3. Enviar mensaje firmado al backend para autenticación
      console.log('Enviando mensaje firmado al backend...');
      console.log('Mensaje a enviar:', messageResponse.message);
      console.log('Firma:', signature);
      
      const authResponse = await apiService.signIn(messageResponse.message, signature);

      // 4. Autenticación exitosa
      setIsAuthenticated(true);
      setAuthStatus('authenticated');
      
      // Cambiar el estado a 'idle' después de 3 segundos para ocultar el mensaje de éxito
      setTimeout(() => {
        setAuthStatus('idle');
      }, 3000);
      
      console.log('Autenticación exitosa para:', authResponse.address);
      return true;

    } catch (error: any) {
      console.error('Error en autenticación SIWE:', error);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error desconocido en la autenticación';
      
      if (error.message.includes('User rejected')) {
        errorMessage = 'Firma cancelada por el usuario';
      } else if (error.message.includes('Nonce inválido')) {
        errorMessage = 'Sesión expirada. Intenta nuevamente.';
      } else if (error.message.includes('Firma inválida')) {
        errorMessage = 'Firma inválida. Verifica tu wallet.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setAuthStatus('error');
      setIsAuthenticated(false);
      
      return false;
    }
  }, [address, isConnected, signMessageAsync]);

  /**
   * Cierra la sesión del usuario
   */
  const handleLogout = useCallback(() => {
    apiService.logout();
    setIsAuthenticated(false);
    setAuthStatus('idle');
    setError('');
    console.log('Sesión cerrada');
  }, []);

  /**
   * Resetea el estado de error
   */
  const clearError = useCallback(() => {
    setError('');
    if (authStatus === 'error') {
      setAuthStatus('idle');
    }
  }, [authStatus]);

  /**
   * Verifica si el backend está disponible
   */
  const checkBackendHealth = useCallback(async (): Promise<boolean> => {
    try {
      await apiService.checkHealth();
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    // Estados
    authStatus,
    isAuthenticated,
    error,
    isLoading: ['requesting', 'signing', 'authenticating'].includes(authStatus),
    
    // Acciones
    authenticate,
    logout: handleLogout,
    clearError,
    checkBackendHealth,
    
    // Información del usuario
    userAddress: isAuthenticated ? address : null,
    token: apiService.getToken(),
  };
}