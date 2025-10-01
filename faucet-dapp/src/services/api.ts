/**
 * Servicio API para comunicarse con el backend Express.js
 * Maneja todas las llamadas HTTP y la autenticación JWT
 */

// Configuración base de la API
const API_BASE_URL = 'http://localhost:3003';

// Tipos para las respuestas de la API
export interface AuthResponse {
  token: string;
  address: string;
}

export interface MessageResponse {
  message: string;
  nonce: string;
}

export interface FaucetStatusResponse {
  hasClaimed: boolean;
  balance: string;
  users: string[];
  faucetAmount: string;
}

export interface ClaimResponse {
  txHash: string;
  success: boolean;
  message?: string;
}

export interface FaucetInfoResponse {
  token: {
    name: string;
    symbol: string;
    decimals: number;
  };
  faucetAmount: string;
  totalUsers: number;
  contractAddress: string;
  network: string;
  chainId: number;
}

export interface UsersResponse {
  users: string[];
  count: number;
  message: string;
}

/**
 * Clase principal del servicio API
 */
class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadTokenFromStorage();
  }

  /**
   * Carga el token JWT desde localStorage
   */
  private loadTokenFromStorage(): void {
    try {
      const storedToken = localStorage.getItem('faucet_jwt_token');
      if (storedToken) {
        this.token = storedToken;
      }
    } catch (error) {
      console.warn('Error cargando token desde localStorage:', error);
    }
  }

  /**
   * Guarda el token JWT en localStorage
   */
  private saveTokenToStorage(token: string): void {
    try {
      localStorage.setItem('faucet_jwt_token', token);
      this.token = token;
    } catch (error) {
      console.warn('Error guardando token en localStorage:', error);
    }
  }

  /**
   * Elimina el token JWT del localStorage
   */
  private removeTokenFromStorage(): void {
    try {
      localStorage.removeItem('faucet_jwt_token');
      this.token = null;
    } catch (error) {
      console.warn('Error eliminando token de localStorage:', error);
    }
  }

  /**
   * Realiza una petición HTTP genérica
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Configurar headers por defecto
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Agregar token de autorización si está disponible
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      // Manejar errores HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          errorData.error || 
          `HTTP Error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en petición a ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  public isAuthenticated(): boolean {
    return this.token !== null;
  }

  /**
   * Obtiene el token actual
   */
  public getToken(): string | null {
    return this.token;
  }

  /**
   * Cierra la sesión del usuario
   */
  public logout(): void {
    this.removeTokenFromStorage();
  }

  // ===== ENDPOINTS DE AUTENTICACIÓN =====

  /**
   * Solicita un mensaje SIWE para firmar
   */
  public async requestMessage(address: string): Promise<MessageResponse> {
    return this.makeRequest<MessageResponse>('/auth/message', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  }

  /**
   * Autentica al usuario con un mensaje SIWE firmado
   */
  public async signIn(message: string, signature: string): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ message, signature }),
    });

    // Guardar token en localStorage
    this.saveTokenToStorage(response.token);
    
    return response;
  }

  // ===== ENDPOINTS DEL FAUCET =====

  /**
   * Obtiene el estado del faucet para una dirección
   */
  public async getFaucetStatus(address: string): Promise<FaucetStatusResponse> {
    return this.makeRequest<FaucetStatusResponse>(`/faucet/status/${address}`);
  }

  /**
   * Reclama tokens del faucet
   */
  public async claimTokens(): Promise<ClaimResponse> {
    return this.makeRequest<ClaimResponse>('/faucet/claim', {
      method: 'POST',
    });
  }

  /**
   * Obtiene la lista de usuarios del faucet
   */
  public async getFaucetUsers(): Promise<UsersResponse> {
    return this.makeRequest<UsersResponse>('/faucet/users');
  }

  /**
   * Obtiene información general del faucet
   */
  public async getFaucetInfo(): Promise<FaucetInfoResponse> {
    return this.makeRequest<FaucetInfoResponse>('/faucet/info');
  }

  /**
   * Verifica el estado de salud del backend
   */
  public async checkHealth(): Promise<{ status: string; blockchain: string; timestamp: string }> {
    return this.makeRequest('/faucet/health');
  }

  // ===== MÉTODOS DE UTILIDAD =====

  /**
   * Verifica si el backend está disponible
   */
  public async isBackendAvailable(): Promise<boolean> {
    try {
      await this.makeRequest('/');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene información básica del backend
   */
  public async getBackendInfo(): Promise<any> {
    return this.makeRequest('/');
  }
}

// Exportar instancia singleton del servicio API
export const apiService = new ApiService();

// Exportar la clase para testing o instancias personalizadas
export { ApiService };