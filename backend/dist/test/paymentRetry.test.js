"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/test/paymentRetry.test.ts
const paymentRetry_1 = require("../utils/paymentRetry");
const payment_interface_1 = require("../interfaces/payment.interface");
describe('RF016 - Sistema de Reintentos', () => {
    describe('retryWithExponentialBackoff', () => {
        test('Debe completar exitosamente en el primer intento', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFn = jest.fn().mockResolvedValue({ data: 'success' });
            const result = yield (0, paymentRetry_1.retryWithExponentialBackoff)(mockFn, {
                maxRetries: 3,
                baseDelay: 100,
                timeout: 5000,
            });
            expect(result.success).toBe(true);
            expect(result.data).toEqual({ data: 'success' });
            expect(result.attempts).toBe(1);
            expect(mockFn).toHaveBeenCalledTimes(1);
        }));
        test('Debe reintentar y completar en el segundo intento (error recuperable)', () => __awaiter(void 0, void 0, void 0, function* () {
            let callCount = 0;
            const mockFn = jest.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    throw { code: 'ETIMEDOUT', message: 'Connection timeout' };
                }
                return Promise.resolve({ data: 'success' });
            });
            const result = yield (0, paymentRetry_1.retryWithExponentialBackoff)(mockFn, {
                maxRetries: 3,
                baseDelay: 100,
                timeout: 5000,
            });
            expect(result.success).toBe(true);
            expect(result.data).toEqual({ data: 'success' });
            expect(result.attempts).toBe(2);
            expect(mockFn).toHaveBeenCalledTimes(2);
        }));
        test('Debe fallar inmediatamente con error no recuperable', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const mockFn = jest.fn().mockRejectedValue({
                message: 'Insufficient funds',
                statusCode: 400,
            });
            const result = yield (0, paymentRetry_1.retryWithExponentialBackoff)(mockFn, {
                maxRetries: 3,
                baseDelay: 100,
                timeout: 5000,
            });
            expect(result.success).toBe(false);
            expect(result.attempts).toBe(1);
            expect((_a = result.error) === null || _a === void 0 ? void 0 : _a.isRetryable).toBe(false);
            expect(mockFn).toHaveBeenCalledTimes(1);
        }));
        test('Debe fallar después de 3 intentos con error recuperable', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const mockFn = jest.fn().mockRejectedValue({
                code: 'ECONNREFUSED',
                message: 'Connection refused',
            });
            const result = yield (0, paymentRetry_1.retryWithExponentialBackoff)(mockFn, {
                maxRetries: 3,
                baseDelay: 100,
                timeout: 5000,
            });
            expect(result.success).toBe(false);
            expect(result.attempts).toBe(3);
            expect((_a = result.error) === null || _a === void 0 ? void 0 : _a.isRetryable).toBe(true);
            expect(mockFn).toHaveBeenCalledTimes(3);
        }));
        test('Debe ejecutar callback onRetry en cada reintento', () => __awaiter(void 0, void 0, void 0, function* () {
            let callCount = 0;
            const mockFn = jest.fn().mockImplementation(() => {
                callCount++;
                if (callCount < 3) {
                    throw { code: 'ETIMEDOUT', message: 'Timeout' };
                }
                return Promise.resolve({ data: 'success' });
            });
            const onRetrySpy = jest.fn();
            const result = yield (0, paymentRetry_1.retryWithExponentialBackoff)(mockFn, {
                maxRetries: 3,
                baseDelay: 100,
                timeout: 5000,
                onRetry: onRetrySpy,
            });
            expect(result.success).toBe(true);
            expect(result.attempts).toBe(3);
            expect(onRetrySpy).toHaveBeenCalledTimes(2); // Solo intentos fallidos
            expect(onRetrySpy).toHaveBeenCalledWith(expect.objectContaining({ code: payment_interface_1.PaymentErrorCode.TIMEOUT_ERROR }), expect.any(Number));
        }));
        test('Debe aplicar timeout y lanzar error de timeout', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const mockFn = jest.fn().mockImplementation(() => {
                return new Promise(resolve => setTimeout(resolve, 10000));
            });
            const result = yield (0, paymentRetry_1.retryWithExponentialBackoff)(mockFn, {
                maxRetries: 3,
                baseDelay: 100,
                timeout: 500, // Timeout muy corto
            });
            expect(result.success).toBe(false);
            expect((_a = result.error) === null || _a === void 0 ? void 0 : _a.code).toBe(payment_interface_1.PaymentErrorCode.TIMEOUT_ERROR);
            expect((_b = result.error) === null || _b === void 0 ? void 0 : _b.isRetryable).toBe(true);
        }), 10000); // Aumentar timeout del test
        test('Debe aplicar backoff exponencial correctamente', () => __awaiter(void 0, void 0, void 0, function* () {
            const delays = [];
            let callCount = 0;
            const mockFn = jest.fn().mockImplementation(() => {
                callCount++;
                const now = Date.now();
                delays.push(now);
                throw { code: 'ECONNREFUSED', message: 'Connection refused' };
            });
            yield (0, paymentRetry_1.retryWithExponentialBackoff)(mockFn, {
                maxRetries: 3,
                baseDelay: 100,
                timeout: 5000,
            });
            // Verificar que hubo 3 intentos
            expect(delays.length).toBe(3);
            // Verificar backoff: delay entre intento 1 y 2 ~100ms, entre 2 y 3 ~300ms
            if (delays.length >= 2) {
                const delay1 = delays[1] - delays[0];
                expect(delay1).toBeGreaterThanOrEqual(90); // ~100ms con margen
                expect(delay1).toBeLessThan(200);
            }
            if (delays.length >= 3) {
                const delay2 = delays[2] - delays[1];
                expect(delay2).toBeGreaterThanOrEqual(280); // ~300ms con margen
                expect(delay2).toBeLessThan(400);
            }
        }), 10000);
    });
});
