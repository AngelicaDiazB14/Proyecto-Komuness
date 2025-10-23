"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentErrorHandler = void 0;
// src/utils/paymentErrorHandler.ts
const payment_interface_1 = require("../interfaces/payment.interface");
/**
 * Clase para manejar y categorizar errores de pago
 */
class PaymentErrorHandler {
    /**
     * Determina si un error debe reintentarse
     */
    static isRetryableError(error) {
        var _a;
        // Errores de conexión (recuperables)
        if (error.code === 'ECONNREFUSED' ||
            error.code === 'ENOTFOUND' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ECONNRESET' ||
            error.code === 'ENETUNREACH') {
            return true;
        }
        // Timeout personalizado (recuperable)
        if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes('timeout')) {
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
    static categorizeError(error, attemptNumber) {
        let code = payment_interface_1.PaymentErrorCode.UNKNOWN_ERROR;
        let isRetryable = false;
        const statusCode = error.statusCode || error.status;
        const errorMsg = (error.message || '').toLowerCase();
        // Clasificar según el tipo de error
        // Errores de conexión
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' ||
            error.code === 'ECONNRESET' || error.code === 'ENETUNREACH') {
            code = payment_interface_1.PaymentErrorCode.CONNECTION_ERROR;
            isRetryable = true;
        }
        // Timeout
        else if (error.code === 'ETIMEDOUT' || errorMsg.includes('timeout')) {
            code = payment_interface_1.PaymentErrorCode.TIMEOUT_ERROR;
            isRetryable = true;
        }
        // Errores 5xx de PayPal
        else if (statusCode >= 500 && statusCode < 600) {
            code = payment_interface_1.PaymentErrorCode.PAYPAL_SERVER_ERROR;
            isRetryable = true;
        }
        // Errores 429 (rate limiting)
        else if (statusCode === 429) {
            code = payment_interface_1.PaymentErrorCode.NETWORK_ERROR;
            isRetryable = true;
        }
        // Fondos insuficientes
        else if (errorMsg.includes('insufficient')) {
            code = payment_interface_1.PaymentErrorCode.INSUFFICIENT_FUNDS;
            isRetryable = false;
        }
        // Tarjeta inválida o vencida
        else if (errorMsg.includes('invalid card') || errorMsg.includes('expired')) {
            code = payment_interface_1.PaymentErrorCode.INVALID_CARD;
            isRetryable = false;
        }
        // Cuenta inválida
        else if (errorMsg.includes('invalid account') || errorMsg.includes('blocked')) {
            code = payment_interface_1.PaymentErrorCode.INVALID_ACCOUNT;
            isRetryable = false;
        }
        // Pago rechazado/declinado
        else if (errorMsg.includes('declined') || errorMsg.includes('cancelled')) {
            code = payment_interface_1.PaymentErrorCode.PAYMENT_DECLINED;
            isRetryable = false;
        }
        // Autorización fallida
        else if (errorMsg.includes('authorization')) {
            code = payment_interface_1.PaymentErrorCode.AUTHORIZATION_FAILED;
            isRetryable = false;
        }
        // Request inválido (4xx)
        else if (statusCode >= 400 && statusCode < 500) {
            code = payment_interface_1.PaymentErrorCode.INVALID_REQUEST;
            isRetryable = false;
        }
        // Crear el objeto PaymentError
        const paymentError = {
            name: 'PaymentError',
            message: error.message || 'Error desconocido en el pago',
            code,
            statusCode,
            isRetryable,
            attemptNumber,
            originalError: error,
            userMessage: this.getUserMessage({ code, statusCode }),
        };
        return paymentError;
    }
    /**
     * Genera un mensaje amigable para el usuario según el tipo de error
     * NUNCA expone detalles técnicos, códigos de error o stack traces
     */
    static getUserMessage(error) {
        switch (error.code) {
            case payment_interface_1.PaymentErrorCode.TIMEOUT_ERROR:
                return 'El pago está tardando más de lo esperado. Estamos reintentando la operación.';
            case payment_interface_1.PaymentErrorCode.CONNECTION_ERROR:
            case payment_interface_1.PaymentErrorCode.NETWORK_ERROR:
                return 'No pudimos conectar con PayPal. Verificando la conexión e intentando nuevamente.';
            case payment_interface_1.PaymentErrorCode.PAYPAL_SERVER_ERROR:
                return 'PayPal está experimentando problemas temporales. Reintentando la operación.';
            case payment_interface_1.PaymentErrorCode.INSUFFICIENT_FUNDS:
                return 'Fondos insuficientes. Por favor, verifica tu saldo o utiliza otro método de pago.';
            case payment_interface_1.PaymentErrorCode.INVALID_CARD:
                return 'Tarjeta o cuenta inválida. Por favor, verifica los datos e intenta nuevamente.';
            case payment_interface_1.PaymentErrorCode.INVALID_ACCOUNT:
                return 'La cuenta de PayPal no es válida o está bloqueada. Contacta con PayPal para más información.';
            case payment_interface_1.PaymentErrorCode.PAYMENT_DECLINED:
                return 'El pago fue rechazado. Por favor, contacta a tu banco o utiliza otro método de pago.';
            case payment_interface_1.PaymentErrorCode.AUTHORIZATION_FAILED:
                return 'No se pudo autorizar el pago. Verifica tus credenciales e intenta nuevamente.';
            case payment_interface_1.PaymentErrorCode.INVALID_REQUEST:
                return 'Hubo un problema con los datos del pago. Por favor, intenta nuevamente.';
            case payment_interface_1.PaymentErrorCode.UNKNOWN_ERROR:
            default:
                return 'Ocurrió un error al procesar el pago. Por favor, intenta nuevamente o contacta con soporte.';
        }
    }
    /**
     * Obtiene un código HTTP apropiado para responder al cliente
     */
    static getHttpStatusCode(error) {
        if (error.statusCode) {
            return error.statusCode;
        }
        // Mapear códigos de error a status HTTP
        switch (error.code) {
            case payment_interface_1.PaymentErrorCode.INVALID_REQUEST:
            case payment_interface_1.PaymentErrorCode.INVALID_CARD:
            case payment_interface_1.PaymentErrorCode.INVALID_ACCOUNT:
                return 400;
            case payment_interface_1.PaymentErrorCode.AUTHORIZATION_FAILED:
                return 401;
            case payment_interface_1.PaymentErrorCode.PAYMENT_DECLINED:
            case payment_interface_1.PaymentErrorCode.INSUFFICIENT_FUNDS:
                return 402;
            case payment_interface_1.PaymentErrorCode.TIMEOUT_ERROR:
                return 408;
            case payment_interface_1.PaymentErrorCode.CONNECTION_ERROR:
            case payment_interface_1.PaymentErrorCode.NETWORK_ERROR:
            case payment_interface_1.PaymentErrorCode.PAYPAL_SERVER_ERROR:
                return 503;
            default:
                return 500;
        }
    }
}
exports.PaymentErrorHandler = PaymentErrorHandler;
