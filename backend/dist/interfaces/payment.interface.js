"use strict";
// src/interfaces/payment.interface.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentErrorCode = void 0;
/**
 * Códigos de error para el sistema de pagos
 */
var PaymentErrorCode;
(function (PaymentErrorCode) {
    // Errores recuperables (permiten reintentos)
    PaymentErrorCode["CONNECTION_ERROR"] = "CONNECTION_ERROR";
    PaymentErrorCode["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    PaymentErrorCode["PAYPAL_SERVER_ERROR"] = "PAYPAL_SERVER_ERROR";
    PaymentErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    // Errores no recuperables (no reintentar)
    PaymentErrorCode["INSUFFICIENT_FUNDS"] = "INSUFFICIENT_FUNDS";
    PaymentErrorCode["INVALID_CARD"] = "INVALID_CARD";
    PaymentErrorCode["INVALID_ACCOUNT"] = "INVALID_ACCOUNT";
    PaymentErrorCode["PAYMENT_DECLINED"] = "PAYMENT_DECLINED";
    PaymentErrorCode["AUTHORIZATION_FAILED"] = "AUTHORIZATION_FAILED";
    PaymentErrorCode["INVALID_REQUEST"] = "INVALID_REQUEST";
    // Errores genéricos
    PaymentErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(PaymentErrorCode || (exports.PaymentErrorCode = PaymentErrorCode = {}));
