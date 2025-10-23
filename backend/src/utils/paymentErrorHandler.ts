// src/utils/paymentErrorHandler.ts
import { PaymentError, PaymentErrorCode } from '../interfaces/payment.interface';

/**
 * Clase para manejar y categorizar errores de pago
 */
export class PaymentErrorHandler {
  
  /**
   * Determina si un error debe reintentarse
   */
  static isRetryableError(error: any): boolean {
    // Errores de conexión (recuperables)
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ENOTFOUND' || 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNRESET' ||
        error.code === 'ENETUNREACH') {
      return true;
    }

    // Timeout personalizado (recuperable)
    if (error.message?.toLowerCase().includes('timeout')) {
      return true;
    }

    // Errores 5xx de PayPal (problemas temporales del servidor)
    if (error.statusCode >= 500 && error.statusCode < 600) {
      return true;
    }

    // Errores 429 (rate limiting - recuperable)
    if (error.statusCode === 429) {
      return true;
    }

    // Errores 4xx generalmente no son recuperables
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return false;
    }

    // Errores específicos no recuperables
    const nonRetryablePatterns = [
      'insufficient',
      'declined',
      'invalid card',
      'invalid account',
      'expired',
      'blocked',
      'cancelled',
      'authorization failed',
    ];

    const errorMsg = (error.message || '').toLowerCase();
    if (nonRetryablePatterns.some(pattern => errorMsg.includes(pattern))) {
      return false;
    }

    // Por defecto, errores desconocidos no se reintentan
    return false;
  }

  /**
   * Categoriza un error y retorna información estructurada
   */
  static categorizeError(error: any, attemptNumber: number): PaymentError {
    let code: PaymentErrorCode = PaymentErrorCode.UNKNOWN_ERROR;
    let isRetryable = false;
    const statusCode = error.statusCode || error.status;
    const errorMsg = (error.message || '').toLowerCase();

    // Clasificar según el tipo de error
    
    // Errores de conexión
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || 
        error.code === 'ECONNRESET' || error.code === 'ENETUNREACH') {
      code = PaymentErrorCode.CONNECTION_ERROR;
      isRetryable = true;
    }
    // Timeout
    else if (error.code === 'ETIMEDOUT' || errorMsg.includes('timeout')) {
      code = PaymentErrorCode.TIMEOUT_ERROR;
      isRetryable = true;
    }
    // Errores 5xx de PayPal
    else if (statusCode >= 500 && statusCode < 600) {
      code = PaymentErrorCode.PAYPAL_SERVER_ERROR;
      isRetryable = true;
    }
    // Errores 429 (rate limiting)
    else if (statusCode === 429) {
      code = PaymentErrorCode.NETWORK_ERROR;
      isRetryable = true;
    }
    // Fondos insuficientes
    else if (errorMsg.includes('insufficient')) {
      code = PaymentErrorCode.INSUFFICIENT_FUNDS;
      isRetryable = false;
    }
    // Tarjeta inválida o vencida
    else if (errorMsg.includes('invalid card') || errorMsg.includes('expired')) {
      code = PaymentErrorCode.INVALID_CARD;
      isRetryable = false;
    }
    // Cuenta inválida
    else if (errorMsg.includes('invalid account') || errorMsg.includes('blocked')) {
      code = PaymentErrorCode.INVALID_ACCOUNT;
      isRetryable = false;
    }
    // Pago rechazado/declinado
    else if (errorMsg.includes('declined') || errorMsg.includes('cancelled')) {
      code = PaymentErrorCode.PAYMENT_DECLINED;
      isRetryable = false;
    }
    // Autorización fallida
    else if (errorMsg.includes('authorization')) {
      code = PaymentErrorCode.AUTHORIZATION_FAILED;
      isRetryable = false;
    }
    // Request inválido (4xx)
    else if (statusCode >= 400 && statusCode < 500) {
      code = PaymentErrorCode.INVALID_REQUEST;
      isRetryable = false;
    }

    // Crear el objeto PaymentError
    const paymentError: PaymentError = {
      name: 'PaymentError',
      message: error.message || 'Error desconocido en el pago',
      code,
      statusCode,
      isRetryable,
      attemptNumber,
      originalError: error,
      userMessage: this.getUserMessage({ code, statusCode } as PaymentError),
    };

    return paymentError;
  }

  /**
   * Genera un mensaje amigable para el usuario según el tipo de error
   * NUNCA expone detalles técnicos, códigos de error o stack traces
   */
  static getUserMessage(error: PaymentError): string {
    switch (error.code) {
      case PaymentErrorCode.TIMEOUT_ERROR:
        return 'El pago está tardando más de lo esperado. Estamos reintentando la operación.';
      
      case PaymentErrorCode.CONNECTION_ERROR:
      case PaymentErrorCode.NETWORK_ERROR:
        return 'No pudimos conectar con PayPal. Verificando la conexión e intentando nuevamente.';
      
      case PaymentErrorCode.PAYPAL_SERVER_ERROR:
        return 'PayPal está experimentando problemas temporales. Reintentando la operación.';
      
      case PaymentErrorCode.INSUFFICIENT_FUNDS:
        return 'Fondos insuficientes. Por favor, verifica tu saldo o utiliza otro método de pago.';
      
      case PaymentErrorCode.INVALID_CARD:
        return 'Tarjeta o cuenta inválida. Por favor, verifica los datos e intenta nuevamente.';
      
      case PaymentErrorCode.INVALID_ACCOUNT:
        return 'La cuenta de PayPal no es válida o está bloqueada. Contacta con PayPal para más información.';
      
      case PaymentErrorCode.PAYMENT_DECLINED:
        return 'El pago fue rechazado. Por favor, contacta a tu banco o utiliza otro método de pago.';
      
      case PaymentErrorCode.AUTHORIZATION_FAILED:
        return 'No se pudo autorizar el pago. Verifica tus credenciales e intenta nuevamente.';
      
      case PaymentErrorCode.INVALID_REQUEST:
        return 'Hubo un problema con los datos del pago. Por favor, intenta nuevamente.';
      
      case PaymentErrorCode.UNKNOWN_ERROR:
      default:
        return 'Ocurrió un error al procesar el pago. Por favor, intenta nuevamente o contacta con soporte.';
    }
  }

  /**
   * Obtiene un código HTTP apropiado para responder al cliente
   */
  static getHttpStatusCode(error: PaymentError): number {
    if (error.statusCode) {
      return error.statusCode;
    }

    // Mapear códigos de error a status HTTP
    switch (error.code) {
      case PaymentErrorCode.INVALID_REQUEST:
      case PaymentErrorCode.INVALID_CARD:
      case PaymentErrorCode.INVALID_ACCOUNT:
        return 400;
      
      case PaymentErrorCode.AUTHORIZATION_FAILED:
        return 401;
      
      case PaymentErrorCode.PAYMENT_DECLINED:
      case PaymentErrorCode.INSUFFICIENT_FUNDS:
        return 402;
      
      case PaymentErrorCode.TIMEOUT_ERROR:
        return 408;
      
      case PaymentErrorCode.CONNECTION_ERROR:
      case PaymentErrorCode.NETWORK_ERROR:
      case PaymentErrorCode.PAYPAL_SERVER_ERROR:
        return 503;
      
      default:
        return 500;
    }
  }
}
