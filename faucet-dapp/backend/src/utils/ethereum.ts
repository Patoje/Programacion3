import { ethers } from 'ethers';
import { config } from '../config';
import { FAUCET_TOKEN_ABI } from './contractABI';
import { demoEthereumService } from './demoService';

/**
 * Clase para manejar interacciones con Ethereum y el contrato FaucetToken
 * Automáticamente usa el servicio demo si DEMO_MODE está activado
 */
export class EthereumService {
  private provider?: ethers.JsonRpcProvider;
  private wallet?: ethers.Wallet;
  private contract?: ethers.Contract;

  constructor() {
    // Solo inicializar conexiones reales si no estamos en modo demo
    if (!config.isDemoMode()) {
      this.initializeRealConnections();
    } else {
      console.log('🎭 Modo Demo activado - No se conectará a la blockchain real');
    }
  }

  /**
   * Inicializa las conexiones reales con Ethereum
   */
  private initializeRealConnections(): void {
    // Inicializar provider con el RPC URL configurado
    this.provider = new ethers.JsonRpcProvider(config.RPC_URL);
    
    // Crear wallet con la clave privada configurada
    this.wallet = new ethers.Wallet(config.PRIVATE_KEY, this.provider);
    
    // Inicializar contrato con ABI, dirección y wallet
    this.contract = new ethers.Contract(
      config.CONTRACT_ADDRESS,
      FAUCET_TOKEN_ABI,
      this.wallet
    );
  }

  /**
   * Verifica si una dirección ya reclamó tokens del faucet
   * @param address - Dirección Ethereum a verificar
   * @returns Promise<boolean> - true si ya reclamó, false si no
   */
  async hasAddressClaimed(address: string): Promise<boolean> {
    // Usar servicio demo si está activado
    if (config.isDemoMode()) {
      return demoEthereumService.hasAddressClaimed(address);
    }

    try {
      const hasClaimed = await this.contract!.hasAddressClaimed(address);
      return hasClaimed;
    } catch (error) {
      console.error('Error verificando si la dirección ya reclamó:', error);
      throw new Error('Error al verificar estado de reclamo');
    }
  }

  /**
   * Obtiene el balance de tokens de una dirección
   * @param address - Dirección Ethereum
   * @returns Promise<string> - Balance formateado en Ether
   */
  async getTokenBalance(address: string): Promise<string> {
    if (config.isDemoMode()) {
      return demoEthereumService.getTokenBalance(address);
    }

    try {
      const balance = await this.contract!.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error obteniendo balance:', error);
      throw new Error('Error al obtener balance de tokens');
    }
  }

  /**
   * Obtiene la lista de usuarios que han interactuado con el faucet
   * @returns Promise<string[]> - Array de direcciones
   */
  async getFaucetUsers(): Promise<string[]> {
    if (config.isDemoMode()) {
      return demoEthereumService.getFaucetUsers();
    }

    try {
      const users = await this.contract!.getFaucetUsers();
      return users;
    } catch (error) {
      console.error('Error obteniendo usuarios del faucet:', error);
      throw new Error('Error al obtener usuarios del faucet');
    }
  }

  /**
   * Obtiene la cantidad de tokens que se otorgan por reclamo
   * @returns Promise<string> - Cantidad formateada en Ether
   */
  async getFaucetAmount(): Promise<string> {
    if (config.isDemoMode()) {
      return demoEthereumService.getFaucetAmount();
    }

    try {
      const amount = await this.contract!.getFaucetAmount();
      return ethers.formatEther(amount);
    } catch (error) {
      console.error('Error obteniendo cantidad del faucet:', error);
      throw new Error('Error al obtener cantidad del faucet');
    }
  }

  /**
   * Ejecuta el reclamo de tokens para una dirección específica
   * @param recipientAddress - Dirección que recibirá los tokens
   * @returns Promise<string> - Hash de la transacción
   */
  async claimTokens(recipientAddress: string): Promise<string> {
    if (config.isDemoMode()) {
      return demoEthereumService.claimTokens(recipientAddress);
    }

    try {
      // Verificar que la dirección no haya reclamado antes
      const hasClaimed = await this.hasAddressClaimed(recipientAddress);
      if (hasClaimed) {
        throw new Error('Esta dirección ya ha reclamado tokens');
      }

      // Ejecutar la transacción de reclamo
      const tx = await this.contract!.claimTokens();
      
      // Esperar confirmación de la transacción
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('La transacción no fue confirmada');
      }

      console.log(`Tokens reclamados exitosamente para ${recipientAddress}. TX: ${receipt.hash}`);
      return receipt.hash;
    } catch (error: any) {
      console.error('Error reclamando tokens:', error);
      
      // Manejar errores específicos del contrato
      if (error.message.includes('already claimed')) {
        throw new Error('Esta dirección ya ha reclamado tokens');
      }
      
      if (error.message.includes('insufficient funds')) {
        throw new Error('El contrato no tiene suficientes fondos');
      }
      
      throw new Error(`Error al reclamar tokens: ${error.message}`);
    }
  }

  /**
   * Verifica que una dirección Ethereum sea válida
   * @param address - Dirección a validar
   * @returns boolean - true si es válida, false si no
   */
  static isValidAddress(address: string): boolean {
    if (config.isDemoMode()) {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Obtiene información general del contrato
   * @returns Promise<object> - Información del token
   */
  async getTokenInfo(): Promise<{
    name: string;
    symbol: string;
    decimals: number;
  }> {
    if (config.isDemoMode()) {
      return demoEthereumService.getTokenInfo();
    }

    try {
      const [name, symbol, decimals] = await Promise.all([
        this.contract!.name(),
        this.contract!.symbol(),
        this.contract!.decimals()
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals)
      };
    } catch (error) {
      console.error('Error obteniendo información del token:', error);
      throw new Error('Error al obtener información del token');
    }
  }

  /**
   * Verifica la conectividad con la red Ethereum
   * @returns Promise<boolean> - true si está conectado, false si no
   */
  async checkConnection(): Promise<boolean> {
    if (config.isDemoMode()) {
      return demoEthereumService.checkConnection();
    }

    try {
      const network = await this.provider!.getNetwork();
      console.log(`Conectado a la red: ${network.name} (Chain ID: ${network.chainId})`);
      return true;
    } catch (error) {
      console.error('Error verificando conexión:', error);
      return false;
    }
  }
}

// Exportar instancia singleton del servicio
export const ethereumService = new EthereumService();