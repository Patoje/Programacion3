import rateLimit from 'express-rate-limit';
import { config } from '../config';

/**
 * Rate limiter general para todas las rutas
 * Limita el número de requests por IP en una ventana de tiempo
 */
export const generalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // Ventana de tiempo (default: 15 minutos)
  max: config.RATE_LIMIT_MAX_REQUESTS, // Máximo de requests por ventana (default: 100)
  message: {
    error: 'Demasiadas solicitudes',
    message: 'Has excedido el límite de solicitudes. Intenta nuevamente más tarde.',
    retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000 / 60) // en minutos
  },
  standardHeaders: true, // Incluir headers de rate limit en la respuesta
  legacyHeaders: false, // Deshabilitar headers legacy
  // Función personalizada para generar la clave de rate limiting
  keyGenerator: (req) => {
    // Usar IP del cliente, considerando proxies
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  // Handler personalizado cuando se excede el límite
  handler: (req, res) => {
    console.warn(`Rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'Demasiadas solicitudes',
      message: 'Has excedido el límite de solicitudes. Intenta nuevamente más tarde.',
      retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000 / 60)
    });
  }
});

/**
 * Rate limiter estricto para endpoints críticos como autenticación
 * Límite más restrictivo para prevenir ataques de fuerza bruta
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 intentos de autenticación por IP cada 15 minutos
  message: {
    error: 'Demasiados intentos de autenticación',
    message: 'Has excedido el límite de intentos de autenticación. Intenta nuevamente en 15 minutos.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    console.warn(`Rate limit de autenticación excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'Demasiados intentos de autenticación',
      message: 'Has excedido el límite de intentos de autenticación. Intenta nuevamente en 15 minutos.',
      retryAfter: 15
    });
  }
});

/**
 * Rate limiter para endpoints del faucet
 * Previene spam en las operaciones del faucet
 */
export const faucetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Máximo 5 operaciones del faucet por IP cada hora
  message: {
    error: 'Demasiadas operaciones del faucet',
    message: 'Has excedido el límite de operaciones del faucet. Intenta nuevamente en 1 hora.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    console.warn(`Rate limit del faucet excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'Demasiadas operaciones del faucet',
      message: 'Has excedido el límite de operaciones del faucet. Intenta nuevamente en 1 hora.',
      retryAfter: 60
    });
  }
});

/**
 * Rate limiter muy estricto para el endpoint de reclamo de tokens
 * Solo permite 1 reclamo por IP cada 24 horas
 */
export const claimLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 1, // Solo 1 reclamo por IP cada 24 horas
  message: {
    error: 'Límite de reclamo diario excedido',
    message: 'Solo puedes reclamar tokens una vez cada 24 horas por IP.',
    retryAfter: 24 * 60 // en minutos
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    console.warn(`Rate limit de reclamo diario excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'Límite de reclamo diario excedido',
      message: 'Solo puedes reclamar tokens una vez cada 24 horas por IP.',
      retryAfter: 24 * 60
    });
  }
});