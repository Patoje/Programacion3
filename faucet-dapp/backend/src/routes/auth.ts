import { Router, Request, Response } from 'express';
import { SiweMessage } from 'siwe';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { authLimiter } from '../middleware/rateLimiter';
import { 
  SiweMessageData, 
  AuthResponse, 
  MessageResponse 
} from '../types';

const router = Router();

// Store temporal para nonces (en producción usar Redis o base de datos)
const nonceStore = new Map<string, { nonce: string; timestamp: number }>();

// Limpiar nonces expirados cada 10 minutos
setInterval(() => {
  const now = Date.now();
  const expireTime = 10 * 60 * 1000; // 10 minutos
  
  for (const [key, value] of nonceStore.entries()) {
    if (now - value.timestamp > expireTime) {
      nonceStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * POST /auth/message
 * Genera un mensaje SIWE para ser firmado por el cliente
 */
router.post('/message', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.body;

    // Validar que se proporcione una dirección
    if (!address) {
      res.status(400).json({
        error: 'Dirección requerida',
        message: 'Debes proporcionar una dirección Ethereum válida.'
      });
      return;
    }

    // Validar formato de la dirección
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      res.status(400).json({
        error: 'Dirección inválida',
        message: 'La dirección Ethereum proporcionada no tiene un formato válido.'
      });
      return;
    }

    // Generar nonce único
    const nonce = generateNonce();
    
    // Crear mensaje SIWE
    const siweMessage = new SiweMessage({
      domain: req.get('host') || 'localhost:3001',
      address: address,
      statement: 'Inicia sesión en Faucet DApp con tu wallet Ethereum.',
      uri: req.get('origin') || `http://localhost:${config.PORT}`,
      version: '1',
      chainId: 11155111, // Sepolia
      nonce: nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutos
      resources: []
    });

    // Almacenar nonce temporalmente
    nonceStore.set(address.toLowerCase(), {
      nonce: nonce,
      timestamp: Date.now()
    });

    const response: MessageResponse = {
      message: siweMessage.prepareMessage(),
      nonce: nonce
    };

    console.log(`Mensaje SIWE generado para dirección: ${address}`);
    res.json(response);

  } catch (error) {
    console.error('Error generando mensaje SIWE:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo generar el mensaje de autenticación.'
    });
  }
});

/**
 * POST /auth/signin
 * Verifica la firma SIWE y genera un JWT token
 */
router.post('/signin', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, signature }: SiweMessageData = req.body;

    // Validar que se proporcionen mensaje y firma
    if (!message || !signature) {
      res.status(400).json({
        error: 'Datos incompletos',
        message: 'Debes proporcionar tanto el mensaje como la firma.'
      });
      return;
    }

    // Parsear el mensaje SIWE
    let siweMessage: SiweMessage;
    try {
      console.log('Mensaje recibido para parsear:', message);
      siweMessage = new SiweMessage(message);
      console.log('Mensaje SIWE parseado exitosamente:', siweMessage.address);
    } catch (error) {
      console.error('Error parseando mensaje SIWE:', error);
      res.status(400).json({
        error: 'Mensaje inválido',
        message: 'El mensaje SIWE proporcionado no tiene un formato válido.'
      });
      return;
    }

    // Verificar que el nonce existe y es válido
    const storedNonce = nonceStore.get(siweMessage.address.toLowerCase());
    if (!storedNonce || storedNonce.nonce !== siweMessage.nonce) {
      res.status(400).json({
        error: 'Nonce inválido',
        message: 'El nonce del mensaje no es válido o ha expirado.'
      });
      return;
    }

    // Verificar que el nonce no haya expirado (10 minutos)
    if (Date.now() - storedNonce.timestamp > 10 * 60 * 1000) {
      nonceStore.delete(siweMessage.address.toLowerCase());
      res.status(400).json({
        error: 'Mensaje expirado',
        message: 'El mensaje de autenticación ha expirado. Genera uno nuevo.'
      });
      return;
    }

    // Verificar la firma
    try {
      const fields = await siweMessage.verify({ 
        signature,
        domain: req.get('host') || 'localhost:3001',
        nonce: storedNonce.nonce
      });
      
      if (!fields.success) {
        res.status(401).json({
          error: 'Firma inválida',
          message: 'La firma proporcionada no es válida para este mensaje.'
        });
        return;
      }

      // Limpiar el nonce usado
      nonceStore.delete(siweMessage.address.toLowerCase());

      // Generar JWT token
      const tokenPayload = {
        address: siweMessage.address.toLowerCase()
      };

      const token = jwt.sign(
        tokenPayload,
        config.JWT_SECRET,
        { 
          expiresIn: '24h', // Token válido por 24 horas
          issuer: 'faucet-dapp-backend',
          audience: 'faucet-dapp-frontend'
        }
      );

      const response: AuthResponse = {
        token: token,
        address: siweMessage.address.toLowerCase()
      };

      console.log(`Autenticación exitosa para dirección: ${siweMessage.address}`);
      res.json(response);

    } catch (error) {
      console.error('Error verificando firma SIWE:', error);
      res.status(401).json({
        error: 'Error de verificación',
        message: 'No se pudo verificar la firma del mensaje.'
      });
    }

  } catch (error) {
    console.error('Error en proceso de signin:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo procesar la solicitud de autenticación.'
    });
  }
});

/**
 * Genera un nonce aleatorio para SIWE
 * @returns string - Nonce hexadecimal de 32 caracteres
 */
function generateNonce(): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export default router;