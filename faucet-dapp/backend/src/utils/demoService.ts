import { config } from '../config';

/**
 * Servicio demo que simula las respuestas del contrato Ethereum
 * sin realizar transacciones reales en la blockchain
 */
export class DemoEthereumService {
  // Datos simulados para el modo demo
  private demoUsers: string[] = [
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1',
    '0x8ba1f109551bD432803012645Hac136c9c1659e',
    '0x1234567890123456789012345678901234567890',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  ];

  private claimedAddresses: Set<string> = new Set([
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1',
    '0x8ba1f109551bD432803012645Hac136c9c1659e'
  ]);

  /**
   * Simula verificar si una dirección ya reclamó tokens
   */
  async hasAddressClaimed(address: string): Promise<boolean> {
    // Simular delay de red
    await this.simulateNetworkDelay();
    
    return this.claimedAddresses.has(address.toLowerCase());
  }

  /**
   * Simula obtener el balance de tokens de una dirección
   */
  async getTokenBalance(address: string): Promise<string> {
    await this.simulateNetworkDelay();
    
    // Simular diferentes balances según la dirección
    if (this.claimedAddresses.has(address.toLowerCase())) {
      return '1000000.0'; // 1M tokens para direcciones que ya reclamaron
    }
    return '0.0'; // 0 tokens para direcciones nuevas
  }

  /**
   * Simula obtener la lista de usuarios del faucet
   */
  async getFaucetUsers(): Promise<string[]> {
    await this.simulateNetworkDelay();
    return [...this.demoUsers];
  }

  /**
   * Simula obtener la cantidad de tokens del faucet
   */
  async getFaucetAmount(): Promise<string> {
    await this.simulateNetworkDelay();
    return '1000000.0'; // 1M tokens por reclamo
  }

  /**
   * Simula el reclamo de tokens
   */
  async claimTokens(recipientAddress: string): Promise<string> {
    await this.simulateNetworkDelay();
    
    // Verificar si ya reclamó
    if (this.claimedAddresses.has(recipientAddress.toLowerCase())) {
      throw new Error('Esta dirección ya ha reclamado tokens');
    }

    // Simular el reclamo exitoso
    this.claimedAddresses.add(recipientAddress.toLowerCase());
    this.demoUsers.push(recipientAddress);

    // Generar hash de transacción falso pero realista
    const fakeHash = this.generateFakeTransactionHash();
    
    console.log(`[DEMO] Tokens "reclamados" para ${recipientAddress}. TX simulado: ${fakeHash}`);
    return fakeHash;
  }

  /**
   * Simula obtener información del token
   */
  async getTokenInfo(): Promise<{
    name: string;
    symbol: string;
    decimals: number;
  }> {
    await this.simulateNetworkDelay();
    
    return {
      name: 'FaucetToken (Demo)',
      symbol: 'FTKN',
      decimals: 18
    };
  }

  /**
   * Simula verificar la conectividad con la blockchain
   */
  async checkConnection(): Promise<boolean> {
    await this.simulateNetworkDelay();
    
    if (config.isDemoMode()) {
      console.log('🎭 Modo Demo: Simulando conexión exitosa con Sepolia');
      return true;
    }
    
    return false;
  }

  /**
   * Valida si una dirección Ethereum es válida (misma lógica que el servicio real)
   */
  static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Simula delay de red para hacer más realista la experiencia
   */
  private async simulateNetworkDelay(): Promise<void> {
    const delay = Math.random() * 1000 + 500; // Entre 500ms y 1.5s
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Genera un hash de transacción falso pero con formato realista
   */
  private generateFakeTransactionHash(): string {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  /**
   * Resetea los datos demo (útil para testing)
   */
  public resetDemoData(): void {
    this.claimedAddresses.clear();
    this.demoUsers = [
      '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1',
      '0x8ba1f109551bD432803012645Hac136c9c1659e',
      '0x1234567890123456789012345678901234567890',
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    ];
    this.claimedAddresses.add('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1');
    this.claimedAddresses.add('0x8ba1f109551bD432803012645Hac136c9c1659e');
  }
}

// Exportar instancia singleton del servicio demo
export const demoEthereumService = new DemoEthereumService();