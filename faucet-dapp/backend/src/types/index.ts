import { Request } from 'express';

/**
 * Interfaz para el payload del JWT
 */
export interface JWTPayload {
  address: string;
  iat?: number;
  exp?: number;
}

/**
 * Interfaz para extender Request con información del usuario autenticado
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    address: string;
  };
}

/**
 * Interfaz para el mensaje SIWE
 */
export interface SiweMessageData {
  message: string;
  signature: string;
}

/**
 * Interfaz para la respuesta de autenticación
 */
export interface AuthResponse {
  token: string;
  address: string;
}

/**
 * Interfaz para la respuesta de mensaje SIWE
 */
export interface MessageResponse {
  message: string;
  nonce: string;
}

/**
 * Interfaz para la respuesta de estado del faucet
 */
export interface FaucetStatusResponse {
  hasClaimed: boolean;
  balance: string;
  users: string[];
  faucetAmount: string;
}

/**
 * Interfaz para la respuesta de reclamo de tokens
 */
export interface ClaimResponse {
  txHash: string;
  success: boolean;
  message?: string;
}

/**
 * Interfaz para errores de la API
 */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}