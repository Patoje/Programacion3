import { Router, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { faucetLimiter, claimLimiter } from '../middleware/rateLimiter';
import { ethereumService, EthereumService } from '../utils/ethereum';
import { 
  AuthenticatedRequest, 
  FaucetStatusResponse, 
  ClaimResponse 
} from '../types';

const router = Router();

/**
 * GET /faucet/status/:address
 * Obtiene el estado del faucet para una dirección específica
 * Requiere autenticación JWT
 */
router.get('/status/:address', 
  authenticateToken, 
  faucetLimiter, 
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { address } = req.params;

      // Validar formato de dirección
      if (!EthereumService.isValidAddress(address)) {
        res.status(400).json({
          error: 'Dirección inválida',
          message: 'La dirección Ethereum proporcionada no tiene un formato válido.'
        });
        return;
      }

      // Verificar que el usuario autenticado puede consultar esta dirección
      // (opcional: permitir solo consultar la propia dirección)
      if (req.user?.address !== address.toLowerCase()) {
        res.status(403).json({
          error: 'Acceso denegado',
          message: 'Solo puedes consultar el estado de tu propia dirección.'
        });
        return;
      }

      // Obtener información del faucet en paralelo
      const [hasClaimed, balance, users, faucetAmount] = await Promise.all([
        ethereumService.hasAddressClaimed(address),
        ethereumService.getTokenBalance(address),
        ethereumService.getFaucetUsers(),
        ethereumService.getFaucetAmount()
      ]);

      const response: FaucetStatusResponse = {
        hasClaimed,
        balance,
        users,
        faucetAmount
      };

      console.log(`Estado del faucet consultado para dirección: ${address}`);
      res.json(response);

    } catch (error: any) {
      console.error('Error obteniendo estado del faucet:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message || 'No se pudo obtener el estado del faucet.'
      });
    }
  }
);

/**
 * POST /faucet/claim
 * Reclama tokens del faucet para el usuario autenticado
 * Requiere autenticación JWT y tiene rate limiting estricto
 */
router.post('/claim', 
  authenticateToken, 
  claimLimiter, 
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Obtener dirección del usuario autenticado
      const userAddress = req.user?.address;
      
      if (!userAddress) {
        res.status(401).json({
          error: 'Usuario no autenticado',
          message: 'No se pudo identificar la dirección del usuario.'
        });
        return;
      }

      // Verificar que la dirección no haya reclamado antes
      const hasClaimed = await ethereumService.hasAddressClaimed(userAddress);
      if (hasClaimed) {
        res.status(400).json({
          error: 'Ya reclamado',
          message: 'Esta dirección ya ha reclamado tokens del faucet.'
        });
        return;
      }

      // Ejecutar el reclamo de tokens
      console.log(`Iniciando reclamo de tokens para dirección: ${userAddress}`);
      const txHash = await ethereumService.claimTokens(userAddress);

      const response: ClaimResponse = {
        txHash,
        success: true,
        message: 'Tokens reclamados exitosamente'
      };

      console.log(`Reclamo exitoso para ${userAddress}. TX: ${txHash}`);
      res.json(response);

    } catch (error: any) {
      console.error('Error reclamando tokens:', error);
      
      // Manejar errores específicos
      if (error.message.includes('already claimed')) {
        res.status(400).json({
          error: 'Ya reclamado',
          message: 'Esta dirección ya ha reclamado tokens del faucet.'
        });
        return;
      }

      if (error.message.includes('insufficient funds')) {
        res.status(503).json({
          error: 'Fondos insuficientes',
          message: 'El faucet no tiene suficientes fondos en este momento.'
        });
        return;
      }

      const response: ClaimResponse = {
        txHash: '',
        success: false,
        message: error.message || 'Error al reclamar tokens'
      };

      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message || 'No se pudo procesar el reclamo de tokens.',
        details: response
      });
    }
  }
);

/**
 * GET /faucet/users
 * Obtiene la lista de usuarios que han interactuado con el faucet
 * Endpoint público (no requiere autenticación)
 */
router.get('/users', 
  faucetLimiter, 
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const users = await ethereumService.getFaucetUsers();
      
      res.json({
        users,
        count: users.length,
        message: 'Lista de usuarios obtenida exitosamente'
      });

      console.log(`Lista de usuarios del faucet consultada. Total: ${users.length}`);

    } catch (error: any) {
      console.error('Error obteniendo usuarios del faucet:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message || 'No se pudo obtener la lista de usuarios.'
      });
    }
  }
);

/**
 * GET /faucet/info
 * Obtiene información general del token y faucet
 * Endpoint público (no requiere autenticación)
 */
router.get('/info', 
  faucetLimiter, 
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Obtener información del token y faucet en paralelo
      const [tokenInfo, faucetAmount, users] = await Promise.all([
        ethereumService.getTokenInfo(),
        ethereumService.getFaucetAmount(),
        ethereumService.getFaucetUsers()
      ]);

      res.json({
        token: tokenInfo,
        faucetAmount,
        totalUsers: users.length,
        contractAddress: process.env.CONTRACT_ADDRESS,
        network: 'Sepolia Testnet',
        chainId: 11155111
      });

      console.log('Información general del faucet consultada');

    } catch (error: any) {
      console.error('Error obteniendo información del faucet:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message || 'No se pudo obtener la información del faucet.'
      });
    }
  }
);

/**
 * GET /faucet/health
 * Endpoint de health check para verificar conectividad con la blockchain
 */
router.get('/health', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const isConnected = await ethereumService.checkConnection();
    
    if (isConnected) {
      res.json({
        status: 'healthy',
        blockchain: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        blockchain: 'disconnected',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error: any) {
    console.error('Error en health check:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;