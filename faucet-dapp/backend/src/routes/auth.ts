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
router.post('/message', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.body;

    console.log('📝 Solicitud de mensaje SIWE para:', address);

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
    
    // Crear mensaje SIWE usando la librería oficial
    const domain = req.get('host') || 'localhost:3003';
    const uri = config.FRONTEND_URL || 'http://localhost:5173';
    const statement = 'Inicia sesion en Faucet DApp con tu wallet Ethereum.';
    const chainId = 11155111; // Sepolia
    const issuedAt = new Date();
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

    // Usar la librería oficial SIWE para generar el mensaje
    const siweMessage = new SiweMessage({
      domain: domain,
      address: address,
      statement: statement,
      uri: uri,
      version: '1',
      chainId: chainId,
      nonce: nonce,
      issuedAt: issuedAt.toISOString(),
      expirationTime: expirationTime.toISOString()
    });

    const siweMessageText = siweMessage.prepareMessage();

    console.log('📝 Mensaje SIWE generado con librería oficial:', siweMessageText);

    // Almacenar nonce temporalmente
    nonceStore.set(address.toLowerCase(), {
      nonce: nonce,
      timestamp: Date.now()
    });

    const response: MessageResponse = {
      message: siweMessageText,
      nonce: nonce
    };

    console.log(`✅ Mensaje SIWE generado para dirección: ${address}`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error generando mensaje SIWE:', error);
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
router.post('/signin', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, signature }: SiweMessageData = req.body;

    console.log('🔐 Solicitud de signin SIWE');
    console.log('Mensaje recibido:', message);
    console.log('Firma recibida:', signature);

    // Validar que se proporcionen mensaje y firma
    if (!message || !signature) {
      res.status(400).json({
        error: 'Datos incompletos',
        message: 'Debes proporcionar tanto el mensaje como la firma.'
      });
      return;
    }

    // Análisis detallado del mensaje original
    console.log('🔍 ANÁLISIS DETALLADO DEL MENSAJE:');
    console.log('Tipo:', typeof message);
    console.log('Longitud:', message.length);
    console.log('Mensaje completo (JSON):', JSON.stringify(message));
    
    // Mostrar cada carácter problemático
    console.log('🔍 Caracteres alrededor de la posición 119:');
    for (let i = 110; i < 130 && i < message.length; i++) {
      const char = message.charAt(i);
      const code = message.charCodeAt(i);
      console.log(`Pos ${i}: "${char}" (ASCII: ${code})`);
    }
    
    // Mostrar líneas del mensaje
    const lines = message.split('\n');
    console.log('📝 LÍNEAS DEL MENSAJE:');
    lines.forEach((line, index) => {
      console.log(`Línea ${index + 1}: "${line}" (${line.length} chars)`);
      // Mostrar códigos ASCII de caracteres especiales
      for (let i = 0; i < line.length; i++) {
        const code = line.charCodeAt(i);
        if (code > 127 || code < 32) {
          console.log(`  Carácter especial en pos ${i}: ASCII ${code}`);
        }
      }
    });

    // Limpiar el mensaje: eliminar espacios en blanco al final de cada línea
    const cleanedMessage = message
      .split('\n')
      .map((line: string) => line.trimEnd()) // Eliminar espacios al final de cada línea
      .join('\n')
      .trim(); // Eliminar espacios al inicio y final del mensaje completo

    console.log('🧹 Mensaje limpio:', cleanedMessage);
    console.log('📏 Longitud original vs limpia:', message.length, 'vs', cleanedMessage.length);

    // Parsear el mensaje SIWE
    let siweMessage: SiweMessage;
    try {
      console.log('🔄 Intentando parsear mensaje SIWE limpio...');
      
      siweMessage = new SiweMessage(cleanedMessage);
      console.log('✅ Mensaje SIWE parseado exitosamente:', siweMessage.address);
    } catch (error) {
      console.error('❌ Error parseando mensaje SIWE:', error);
      console.error('❌ Mensaje que causó el error:', message);
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