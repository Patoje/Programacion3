import express from 'express';
import cors from 'cors';
import { config } from './config';
import { generalLimiter } from './middleware/rateLimiter';
import { ethereumService } from './utils/ethereum';

// Importar rutas
import authRoutes from './routes/auth';
import faucetRoutes from './routes/faucet';

/**
 * Servidor Express.js para Faucet DApp Backend
 * Implementa autenticación SIWE y endpoints protegidos para interactuar con el smart contract
 */
class FaucetServer {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.PORT;
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Configura middleware global de la aplicación
   */
  private initializeMiddleware(): void {
    // Configurar CORS
    this.app.use(cors({
      origin: config.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Middleware para parsear JSON
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting general
    this.app.use(generalLimiter);

    // Middleware de logging
    this.app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
      next();
    });

    // Headers de seguridad
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      next();
    });
  }

  /**
   * Configura las rutas de la aplicación
   */
  private initializeRoutes(): void {
    // Ruta de health check básica
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Faucet DApp Backend API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          auth: '/auth',
          faucet: '/faucet',
          health: '/faucet/health'
        }
      });
    });

    // Rutas de autenticación
    this.app.use('/auth', authRoutes);

    // Rutas del faucet
    this.app.use('/faucet', faucetRoutes);

    // Ruta 404 para endpoints no encontrados
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint no encontrado',
        message: `La ruta ${req.method} ${req.originalUrl} no existe.`,
        availableEndpoints: {
          'POST /auth/message': 'Generar mensaje SIWE',
          'POST /auth/signin': 'Autenticarse con SIWE',
          'GET /faucet/status/:address': 'Obtener estado del faucet (requiere auth)',
          'POST /faucet/claim': 'Reclamar tokens (requiere auth)',
          'GET /faucet/users': 'Obtener lista de usuarios',
          'GET /faucet/info': 'Obtener información del faucet',
          'GET /faucet/health': 'Health check'
        }
      });
    });
  }

  /**
   * Configura el manejo global de errores
   */
  private initializeErrorHandling(): void {
    // Middleware de manejo de errores
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error no manejado:', error);

      // Error de parsing JSON
      if (error instanceof SyntaxError && 'body' in error) {
        res.status(400).json({
          error: 'JSON inválido',
          message: 'El cuerpo de la solicitud contiene JSON malformado.'
        });
        return;
      }

      // Error genérico
      res.status(500).json({
        error: 'Error interno del servidor',
        message: config.isDevelopment() ? error.message : 'Ha ocurrido un error inesperado.',
        ...(config.isDevelopment() && { stack: error.stack })
      });
    });

    // Manejo de promesas rechazadas no capturadas
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Promesa rechazada no manejada:', reason);
      console.error('En promesa:', promise);
    });

    // Manejo de excepciones no capturadas
    process.on('uncaughtException', (error) => {
      console.error('Excepción no capturada:', error);
      process.exit(1);
    });
  }

  /**
   * Verifica la conectividad con la blockchain antes de iniciar el servidor
   */
  private async checkBlockchainConnection(): Promise<void> {
    try {
      console.log('Verificando conexión con la blockchain...');
      const isConnected = await ethereumService.checkConnection();
      
      if (!isConnected) {
        throw new Error('No se pudo conectar con la blockchain');
      }

      // Verificar información del contrato
      const tokenInfo = await ethereumService.getTokenInfo();
      console.log(`Contrato conectado: ${tokenInfo.name} (${tokenInfo.symbol})`);
      
    } catch (error) {
      console.error('Error conectando con la blockchain:', error);
      throw error;
    }
  }

  /**
   * Inicia el servidor
   */
  public async start(): Promise<void> {
    try {
      // Verificar conexión con blockchain
      await this.checkBlockchainConnection();

      // Iniciar servidor HTTP
      this.app.listen(this.port, () => {
        console.log('='.repeat(50));
        console.log('🚀 Faucet DApp Backend iniciado exitosamente');
        console.log('='.repeat(50));
        console.log(`📡 Servidor corriendo en: http://localhost:${this.port}`);
        console.log(`🌍 Entorno: ${config.NODE_ENV}`);
        console.log(`⛓️  Red: Sepolia Testnet (Chain ID: 11155111)`);
        console.log(`📄 Contrato: ${config.CONTRACT_ADDRESS}`);
        console.log(`🔗 RPC URL: ${config.RPC_URL}`);
        console.log(`🎯 Frontend URL: ${config.FRONTEND_URL}`);
        console.log('='.repeat(50));
        console.log('📋 Endpoints disponibles:');
        console.log('   POST /auth/message - Generar mensaje SIWE');
        console.log('   POST /auth/signin - Autenticarse con SIWE');
        console.log('   GET  /faucet/status/:address - Estado del faucet (auth)');
        console.log('   POST /faucet/claim - Reclamar tokens (auth)');
        console.log('   GET  /faucet/users - Lista de usuarios');
        console.log('   GET  /faucet/info - Información del faucet');
        console.log('   GET  /faucet/health - Health check');
        console.log('='.repeat(50));
      });

    } catch (error) {
      console.error('❌ Error iniciando el servidor:', error);
      process.exit(1);
    }
  }

  /**
   * Detiene el servidor gracefully
   */
  public stop(): void {
    console.log('🛑 Deteniendo servidor...');
    process.exit(0);
  }
}

// Crear e iniciar servidor
const server = new FaucetServer();

// Manejar señales de terminación
process.on('SIGTERM', () => server.stop());
process.on('SIGINT', () => server.stop());

// Iniciar servidor
server.start().catch((error) => {
  console.error('❌ Error fatal iniciando servidor:', error);
  process.exit(1);
});