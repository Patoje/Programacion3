import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Configuración centralizada de la aplicación
 * Valida que todas las variables de entorno necesarias estén presentes
 */
class Config {
  // Configuración del servidor
  public readonly PORT: number;
  public readonly NODE_ENV: string;
  
  // Configuración JWT
  public readonly JWT_SECRET: string;
  
  // Configuración de Ethereum
  public readonly PRIVATE_KEY: string;
  public readonly RPC_URL: string;
  public readonly CONTRACT_ADDRESS: string;
  
  // Configuración CORS
  public readonly FRONTEND_URL: string;
  
  // Rate Limiting
  public readonly RATE_LIMIT_WINDOW_MS: number;
  public readonly RATE_LIMIT_MAX_REQUESTS: number;

  // Modo Demo
  public readonly DEMO_MODE: boolean;

  constructor() {
    // Validar variables de entorno obligatorias
    this.validateEnvironmentVariables();
    
    // Asignar valores con defaults seguros
    this.PORT = parseInt(process.env.PORT || '3001', 10);
    this.NODE_ENV = process.env.NODE_ENV || 'development';
    this.JWT_SECRET = process.env.JWT_SECRET!;
    this.PRIVATE_KEY = process.env.PRIVATE_KEY!;
    this.RPC_URL = process.env.RPC_URL!;
    this.CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;
    this.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';
    this.RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
    this.RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
    this.DEMO_MODE = process.env.DEMO_MODE === 'true';
  }

  /**
   * Valida que todas las variables de entorno críticas estén presentes
   */
  private validateEnvironmentVariables(): void {
    const requiredVars = [
      'JWT_SECRET'
    ];

    // En modo demo, no requerimos PRIVATE_KEY, RPC_URL, CONTRACT_ADDRESS
    if (!this.isDemoMode()) {
      requiredVars.push('PRIVATE_KEY', 'RPC_URL', 'CONTRACT_ADDRESS');
    }

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Variables de entorno faltantes: ${missingVars.join(', ')}\n` +
        'Por favor, crea un archivo .env basado en .env.example'
      );
    }

    // Solo validar formato si no estamos en modo demo
    if (!this.isDemoMode()) {
      // Validar formato de dirección del contrato
      if (!this.isValidEthereumAddress(process.env.CONTRACT_ADDRESS!)) {
        throw new Error('CONTRACT_ADDRESS debe ser una dirección Ethereum válida');
      }

      // Validar que la private key tenga el formato correcto
      if (!/^[0-9a-fA-F]{64}$/.test(process.env.PRIVATE_KEY!)) {
        throw new Error('PRIVATE_KEY debe ser una clave privada hexadecimal de 64 caracteres');
      }
    }

    // Validar JWT_SECRET mínimo
    if (process.env.JWT_SECRET!.length < 32) {
      throw new Error('JWT_SECRET debe tener al menos 32 caracteres para ser seguro');
    }
  }

  /**
   * Valida si una cadena es una dirección Ethereum válida
   */
  private isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Indica si la aplicación está en modo desarrollo
   */
  public isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  }

  /**
   * Indica si la aplicación está en modo producción
   */
  public isProduction(): boolean {
    return this.NODE_ENV === 'production';
  }

  /**
   * Indica si la aplicación está en modo demo
   */
  public isDemoMode(): boolean {
    return this.DEMO_MODE;
  }
}

// Exportar instancia singleton de la configuración
export const config = new Config();