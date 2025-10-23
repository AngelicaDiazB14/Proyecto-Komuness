// src/interfaces/payment.interface.ts

/**
 * Códigos de error para el sistema de pagos
 */
export enum PaymentErrorCode {
  // Errores recuperables (permiten reintentos)
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  PAYPAL_SERVER_ERROR = 'PAYPAL_SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Errores no recuperables (no reintentar)
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_CARD = 'INVALID_CARD',
  INVALID_ACCOUNT = 'INVALID_ACCOUNT',
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  
  // Errores genéricos
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Interface extendida de Error para errores de pago
 */
export interface PaymentError extends Error {
  code: PaymentErrorCode;
  statusCode?: number;
  isRetryable: boolean;
  attemptNumber: number;
  originalError?: any;
  userMessage?: string;
}

/**
 * Opciones para el sistema de reintentos
 */
export interface RetryOptions {
  maxRetries: number;           // Número máximo de reintentos (default: 3)
  baseDelay: number;             // Delay base en milisegundos (default: 1000)
  timeout: number;               // Timeout por intento en milisegundos (default: 30000)
  onRetry?: (error: PaymentError, attemptNumber: number) => void; // Callback opcional ejecutado en cada reintento
}

/**
 * Resultado de una operación de pago con reintentos
 */
export interface PaymentResult<T = any> {
  success: boolean;
  data?: T;
  error?: PaymentError;
  attempts: number;
}

/**
 * Entrada en el historial de reintentos
 */
export interface RetryHistoryEntry {
  timestamp: Date;
  attemptNumber: number;
  errorCode: string;
  errorMessage: string;
  statusCode?: number;
}
