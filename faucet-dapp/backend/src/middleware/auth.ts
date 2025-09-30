import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JWTPayload, AuthenticatedRequest } from '../types';

/**
 * Middleware de autenticación JWT
 * Verifica que el token JWT sea válido y extrae la información del usuario
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        error: 'Token de acceso requerido',
        message: 'Debes proporcionar un token JWT válido en el header Authorization'
      });
      return;
    }

    // Verificar y decodificar el token
    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Error verificando token JWT:', err);
        
        // Manejar diferentes tipos de errores JWT
        if (err.name === 'TokenExpiredError') {
          res.status(401).json({
            error: 'Token expirado',
            message: 'El token JWT ha expirado. Por favor, inicia sesión nuevamente.'
          });
          return;
        }
        
        if (err.name === 'JsonWebTokenError') {
          res.status(401).json({
            error: 'Token inválido',
            message: 'El token JWT proporcionado no es válido.'
          });
          return;
        }
        
        res.status(401).json({
          error: 'Error de autenticación',
          message: 'No se pudo verificar el token de acceso.'
        });
        return;
      }

      // Validar que el payload tenga la estructura esperada
      const payload = decoded as JWTPayload;
      if (!payload.address) {
        res.status(401).json({
          error: 'Token inválido',
          message: 'El token no contiene información de dirección válida.'
        });
        return;
      }

      // Agregar información del usuario al request
      req.user = {
        address: payload.address
      };

      next();
    });
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error procesando la autenticación.'
    });
  }
};

/**
 * Middleware opcional de autenticación
 * Similar al anterior pero no falla si no hay token, solo no agrega user al request
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No hay token, continuar sin autenticación
      next();
      return;
    }

    // Intentar verificar el token si está presente
    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
      if (!err && decoded) {
        const payload = decoded as JWTPayload;
        if (payload.address) {
          req.user = {
            address: payload.address
          };
        }
      }
      // Continuar independientemente del resultado
      next();
    });
  } catch (error) {
    // En caso de error, continuar sin autenticación
    console.error('Error en middleware de autenticación opcional:', error);
    next();
  }
};