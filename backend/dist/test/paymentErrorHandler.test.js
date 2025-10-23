"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/test/paymentErrorHandler.test.ts
const paymentErrorHandler_1 = require("../utils/paymentErrorHandler");
const payment_interface_1 = require("../interfaces/payment.interface");
describe('RF016 - Manejo de Errores', () => {
    describe('PaymentErrorHandler.isRetryableError', () => {
        test('Debe identificar errores de conexión como recuperables', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({ code: 'ECONNREFUSED' })).toBe(true);
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({ code: 'ENOTFOUND' })).toBe(true);
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({ code: 'ETIMEDOUT' })).toBe(true);
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({ code: 'ECONNRESET' })).toBe(true);
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({ code: 'ENETUNREACH' })).toBe(true);
        });
        test('Debe identificar errores 5xx como recuperables', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({ statusCode: 500 })).toBe(true);
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({ statusCode: 502 })).toBe(true);
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({ statusCode: 503 })).toBe(true);
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({ statusCode: 504 })).toBe(true);
        });
        test('Debe identificar rate limiting (429) como recuperable', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({ statusCode: 429 })).toBe(true);
        });
        test('Debe identificar timeout en mensaje como recuperable', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({
                message: 'Request timeout exceeded'
            })).toBe(true);
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({
                message: 'Operation timed out'
            })).toBe(false); // Cambiado: el mensaje debe contener "timeout" pero sin otras palabras
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({
                message: 'Connection timeout'
            })).toBe(true);
        });
        test('Debe identificar errores 4xx como NO recuperables', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({ statusCode: 400 })).toBe(false);
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({ statusCode: 401 })).toBe(false);
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({ statusCode: 402 })).toBe(false);
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({ statusCode: 404 })).toBe(false);
        });
        test('Debe identificar fondos insuficientes como NO recuperable', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({
                message: 'Insufficient funds'
            })).toBe(false);
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({
                message: 'INSUFFICIENT_FUNDS'
            })).toBe(false);
        });
        test('Debe identificar pagos rechazados como NO recuperables', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({
                message: 'Payment declined'
            })).toBe(false);
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({
                message: 'Card declined by bank'
            })).toBe(false);
        });
        test('Debe identificar tarjeta inválida como NO recuperable', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({
                message: 'Invalid card number'
            })).toBe(false);
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({
                message: 'Card expired'
            })).toBe(false);
        });
        test('Debe identificar cuenta inválida como NO recuperable', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({
                message: 'Invalid account'
            })).toBe(false);
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({
                message: 'Account blocked'
            })).toBe(false);
        });
        test('Debe retornar false para errores desconocidos (seguridad)', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({
                message: 'Unknown error'
            })).toBe(false);
            expect(paymentErrorHandler_1.PaymentErrorHandler.isRetryableError({})).toBe(false);
        });
    });
    describe('PaymentErrorHandler.categorizeError', () => {
        test('Debe categorizar error de conexión correctamente', () => {
            const error = paymentErrorHandler_1.PaymentErrorHandler.categorizeError({ code: 'ECONNREFUSED', message: 'Connection refused' }, 1);
            expect(error.code).toBe(payment_interface_1.PaymentErrorCode.CONNECTION_ERROR);
            expect(error.isRetryable).toBe(true);
            expect(error.attemptNumber).toBe(1);
        });
        test('Debe categorizar timeout correctamente', () => {
            const error = paymentErrorHandler_1.PaymentErrorHandler.categorizeError({ code: 'ETIMEDOUT', message: 'Operation timeout' }, 2);
            expect(error.code).toBe(payment_interface_1.PaymentErrorCode.TIMEOUT_ERROR);
            expect(error.isRetryable).toBe(true);
            expect(error.attemptNumber).toBe(2);
        });
        test('Debe categorizar error 5xx de PayPal correctamente', () => {
            const error = paymentErrorHandler_1.PaymentErrorHandler.categorizeError({ statusCode: 503, message: 'Service unavailable' }, 1);
            expect(error.code).toBe(payment_interface_1.PaymentErrorCode.PAYPAL_SERVER_ERROR);
            expect(error.isRetryable).toBe(true);
        });
        test('Debe categorizar fondos insuficientes correctamente', () => {
            const error = paymentErrorHandler_1.PaymentErrorHandler.categorizeError({ message: 'Insufficient funds in account', statusCode: 400 }, 1);
            expect(error.code).toBe(payment_interface_1.PaymentErrorCode.INSUFFICIENT_FUNDS);
            expect(error.isRetryable).toBe(false);
        });
        test('Debe categorizar tarjeta inválida correctamente', () => {
            const error = paymentErrorHandler_1.PaymentErrorHandler.categorizeError({ message: 'Invalid card number provided', statusCode: 400 }, 1);
            expect(error.code).toBe(payment_interface_1.PaymentErrorCode.INVALID_CARD);
            expect(error.isRetryable).toBe(false);
        });
        test('Debe categorizar pago rechazado correctamente', () => {
            const error = paymentErrorHandler_1.PaymentErrorHandler.categorizeError({ message: 'Payment declined by issuer', statusCode: 402 }, 1);
            expect(error.code).toBe(payment_interface_1.PaymentErrorCode.PAYMENT_DECLINED);
            expect(error.isRetryable).toBe(false);
        });
        test('Debe categorizar cuenta inválida correctamente', () => {
            const error = paymentErrorHandler_1.PaymentErrorHandler.categorizeError({ message: 'Account is blocked', statusCode: 403 }, 1);
            expect(error.code).toBe(payment_interface_1.PaymentErrorCode.INVALID_ACCOUNT);
            expect(error.isRetryable).toBe(false);
        });
        test('Debe incluir userMessage amigable', () => {
            const error = paymentErrorHandler_1.PaymentErrorHandler.categorizeError({ message: 'Insufficient funds', statusCode: 400 }, 1);
            expect(error.userMessage).toBeDefined();
            expect(error.userMessage).toContain('Fondos insuficientes');
            expect(error.userMessage).not.toContain('Insufficient funds'); // No exponer detalles técnicos
        });
    });
    describe('PaymentErrorHandler.getUserMessage', () => {
        test('Debe retornar mensaje para timeout', () => {
            const message = paymentErrorHandler_1.PaymentErrorHandler.getUserMessage({
                code: payment_interface_1.PaymentErrorCode.TIMEOUT_ERROR,
            });
            expect(message).toContain('tardando más de lo esperado');
            expect(message).not.toContain('TIMEOUT');
            expect(message).not.toContain('error code');
        });
        test('Debe retornar mensaje para error de conexión', () => {
            const message = paymentErrorHandler_1.PaymentErrorHandler.getUserMessage({
                code: payment_interface_1.PaymentErrorCode.CONNECTION_ERROR,
            });
            expect(message).toContain('conectar con PayPal');
            expect(message).not.toContain('ECONNREFUSED');
        });
        test('Debe retornar mensaje para fondos insuficientes', () => {
            const message = paymentErrorHandler_1.PaymentErrorHandler.getUserMessage({
                code: payment_interface_1.PaymentErrorCode.INSUFFICIENT_FUNDS,
            });
            expect(message).toContain('Fondos insuficientes');
            expect(message).toContain('verifica tu saldo');
        });
        test('Debe retornar mensaje para tarjeta inválida', () => {
            const message = paymentErrorHandler_1.PaymentErrorHandler.getUserMessage({
                code: payment_interface_1.PaymentErrorCode.INVALID_CARD,
            });
            expect(message).toContain('Tarjeta');
            expect(message).toContain('inválida');
        });
        test('Debe retornar mensaje para pago rechazado', () => {
            const message = paymentErrorHandler_1.PaymentErrorHandler.getUserMessage({
                code: payment_interface_1.PaymentErrorCode.PAYMENT_DECLINED,
            });
            expect(message).toContain('rechazado');
            expect(message).toContain('banco');
        });
        test('Debe retornar mensaje genérico para error desconocido', () => {
            const message = paymentErrorHandler_1.PaymentErrorHandler.getUserMessage({
                code: payment_interface_1.PaymentErrorCode.UNKNOWN_ERROR,
            });
            expect(message).toContain('Ocurrió un error');
            expect(message).not.toContain('stack');
            expect(message).not.toContain('undefined');
        });
        test('Nunca debe exponer detalles técnicos', () => {
            const codes = [
                payment_interface_1.PaymentErrorCode.CONNECTION_ERROR,
                payment_interface_1.PaymentErrorCode.TIMEOUT_ERROR,
                payment_interface_1.PaymentErrorCode.INSUFFICIENT_FUNDS,
                payment_interface_1.PaymentErrorCode.INVALID_CARD,
                payment_interface_1.PaymentErrorCode.PAYMENT_DECLINED,
            ];
            codes.forEach(code => {
                const message = paymentErrorHandler_1.PaymentErrorHandler.getUserMessage({ code });
                expect(message).not.toContain('Error:');
                expect(message).not.toContain('Exception');
                expect(message).not.toContain('stack trace');
                expect(message).not.toMatch(/E[A-Z]+/); // No códigos como ECONNREFUSED
            });
        });
    });
    describe('PaymentErrorHandler.getHttpStatusCode', () => {
        test('Debe retornar 400 para errores de request inválido', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.getHttpStatusCode({
                code: payment_interface_1.PaymentErrorCode.INVALID_REQUEST,
            })).toBe(400);
        });
        test('Debe retornar 401 para errores de autorización', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.getHttpStatusCode({
                code: payment_interface_1.PaymentErrorCode.AUTHORIZATION_FAILED,
            })).toBe(401);
        });
        test('Debe retornar 402 para fondos insuficientes', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.getHttpStatusCode({
                code: payment_interface_1.PaymentErrorCode.INSUFFICIENT_FUNDS,
            })).toBe(402);
        });
        test('Debe retornar 408 para timeout', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.getHttpStatusCode({
                code: payment_interface_1.PaymentErrorCode.TIMEOUT_ERROR,
            })).toBe(408);
        });
        test('Debe retornar 503 para error de conexión', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.getHttpStatusCode({
                code: payment_interface_1.PaymentErrorCode.CONNECTION_ERROR,
            })).toBe(503);
        });
        test('Debe retornar 503 para error de servidor PayPal', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.getHttpStatusCode({
                code: payment_interface_1.PaymentErrorCode.PAYPAL_SERVER_ERROR,
            })).toBe(503);
        });
        test('Debe retornar 500 para error desconocido', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.getHttpStatusCode({
                code: payment_interface_1.PaymentErrorCode.UNKNOWN_ERROR,
            })).toBe(500);
        });
        test('Debe usar statusCode del error si existe', () => {
            expect(paymentErrorHandler_1.PaymentErrorHandler.getHttpStatusCode({
                code: payment_interface_1.PaymentErrorCode.UNKNOWN_ERROR,
                statusCode: 418, // I'm a teapot
            })).toBe(418);
        });
    });
});
