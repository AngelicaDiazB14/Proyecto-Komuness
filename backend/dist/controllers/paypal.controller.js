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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhook = exports.captureAndUpgrade = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const paypal_1 = require("../utils/paypal");
const paymentRetry_1 = require("../utils/paymentRetry");
const paymentErrorHandler_1 = require("../utils/paymentErrorHandler");
const USERS_COL = "usuarios"; // cambia si tu colección de usuarios tiene otro nombre
const PAY_COL = "payments"; // colección de auditoría/idempotencia
function setUserRolePremium(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id, email } = args;
        const users = mongoose_1.default.connection.collection(USERS_COL);
        const update = { $set: { tipoUsuario: 3 } }; // PREMIUM = 3
        if (id) {
            yield users.updateOne({ _id: new mongoose_1.default.Types.ObjectId(id) }, update);
            return;
        }
        if (email) {
            yield users.updateOne({ email }, update);
            return;
        }
    });
}
function savePayment(doc) {
    return __awaiter(this, void 0, void 0, function* () {
        const col = mongoose_1.default.connection.collection(PAY_COL);
        // índices para idempotencia (si ya existen, ignora el error)
        try {
            yield col.createIndex({ captureId: 1 }, { unique: true, sparse: true });
        }
        catch (_a) { }
        try {
            yield col.createIndex({ eventId: 1 }, { unique: true, sparse: true });
        }
        catch (_b) { }
        try {
            yield col.insertOne(doc);
            return { idempotent: false };
        }
        catch (e) {
            if ((e === null || e === void 0 ? void 0 : e.code) === 11000)
                return { idempotent: true }; // duplicado
            throw e;
        }
    });
}
/** POST /api/paypal/capture  body: { orderId }  (opcional) */
const captureAndUpgrade = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const retryHistory = [];
    try {
        const { orderId } = req.body;
        if (!orderId) {
            res.status(400).json({ error: "orderId requerido" });
            return;
        }
        console.log(`[PayPal] Iniciando captura de orden: ${orderId}`);
        // Ejecutar captureOrder con sistema de reintentos
        const result = yield (0, paymentRetry_1.retryWithExponentialBackoff)(() => (0, paypal_1.captureOrder)(orderId), {
            maxRetries: 3,
            baseDelay: 1000, // 1 segundo
            timeout: 30000, // 30 segundos
            onRetry: (error, attemptNumber) => {
                // Loggear cada reintento
                console.log(`[PayPal] Reintento ${attemptNumber}: ${error.code} - ${error.message}`);
                // Agregar entrada al historial de reintentos
                retryHistory.push({
                    timestamp: new Date(),
                    attemptNumber,
                    errorCode: error.code,
                    errorMessage: error.message,
                    statusCode: error.statusCode,
                });
            },
        });
        // Si la operación falló después de todos los reintentos
        if (!result.success) {
            const error = result.error;
            const userMessage = paymentErrorHandler_1.PaymentErrorHandler.getUserMessage(error);
            const httpStatus = paymentErrorHandler_1.PaymentErrorHandler.getHttpStatusCode(error);
            console.error(`[PayPal] Captura fallida después de ${result.attempts} intentos:`, error.code);
            // Guardar intento fallido en la base de datos para auditoría
            try {
                yield savePayment({
                    orderId,
                    status: 'FAILED',
                    raw: { error: error.message, code: error.code },
                    source: "capture",
                    attemptNumber: result.attempts,
                    lastError: error.message,
                    retryHistory,
                });
            }
            catch (saveError) {
                console.error('[PayPal] Error al guardar intento fallido:', saveError);
            }
            // Responder al cliente con información estructurada
            res.status(httpStatus).json({
                error: error.code,
                message: userMessage,
                canRetry: error.isRetryable,
                attempts: result.attempts,
            });
            return;
        }
        // Operación exitosa - continuar con el flujo normal
        console.log(`[PayPal] ✓ Captura exitosa en ${result.attempts} intento(s)`);
        const data = result.data;
        const resource = data;
        const info = (0, paypal_1.extractPaymentInfo)(resource);
        const userId = (_a = (0, paypal_1.extractUserId)(resource)) !== null && _a !== void 0 ? _a : undefined;
        const saved = yield savePayment({
            orderId,
            captureId: info.captureId,
            status: info.status,
            value: info.value,
            currency: info.currency,
            payerId: info.payerId,
            email: info.email,
            userId: userId ? new mongoose_1.default.Types.ObjectId(userId) : undefined,
            raw: data,
            source: "capture",
            attemptNumber: result.attempts,
            retryHistory: retryHistory.length > 0 ? retryHistory : undefined,
        });
        // Solo actualizar usuario a Premium si el pago fue completado y no es duplicado
        if ((info.status === "COMPLETED" || info.status === "APPROVED") && !saved.idempotent) {
            yield setUserRolePremium({ id: userId, email: (_b = info.email) !== null && _b !== void 0 ? _b : undefined });
            console.log(`[PayPal] Usuario actualizado a Premium: ${userId || info.email}`);
        }
        res.json({
            ok: true,
            status: info.status,
            idempotent: saved.idempotent,
            attempts: result.attempts,
        });
        return;
    }
    catch (e) {
        // Error inesperado no manejado por el sistema de reintentos
        console.error('[PayPal] Error inesperado en captureAndUpgrade:', e);
        res.status(500).json({
            error: "capture_failed",
            message: "Ocurrió un error inesperado al procesar el pago. Por favor, intenta nuevamente.",
            attempts: 1,
        });
        return;
    }
});
exports.captureAndUpgrade = captureAndUpgrade;
/** POST /api/paypal/webhook  (URL configurada en PayPal) */
const webhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const valid = yield (0, paypal_1.verifyWebhookSignature)(req.headers, req.body);
        if (!valid) {
            res.status(400).json({ error: "invalid_signature" });
            return;
        }
        const event = req.body;
        const eventId = event === null || event === void 0 ? void 0 : event.id;
        const resource = event === null || event === void 0 ? void 0 : event.resource;
        const info = (0, paypal_1.extractPaymentInfo)(resource);
        const userId = (_a = (0, paypal_1.extractUserId)(resource)) !== null && _a !== void 0 ? _a : undefined;
        const saved = yield savePayment({
            eventId,
            orderId: (resource === null || resource === void 0 ? void 0 : resource.id) || ((_c = (_b = resource === null || resource === void 0 ? void 0 : resource.supplementary_data) === null || _b === void 0 ? void 0 : _b.related_ids) === null || _c === void 0 ? void 0 : _c.order_id),
            captureId: info.captureId,
            status: info.status,
            value: info.value,
            currency: info.currency,
            payerId: info.payerId,
            email: info.email,
            userId: userId ? new mongoose_1.default.Types.ObjectId(userId) : undefined,
            raw: event,
            source: "webhook",
            event_type: event === null || event === void 0 ? void 0 : event.event_type,
        });
        const okTypes = new Set(["PAYMENT.CAPTURE.COMPLETED", "CHECKOUT.ORDER.APPROVED"]);
        if (okTypes.has(event === null || event === void 0 ? void 0 : event.event_type) && (info.status === "COMPLETED" || info.status === "APPROVED") && !saved.idempotent) {
            yield setUserRolePremium({ id: userId, email: (_d = info.email) !== null && _d !== void 0 ? _d : undefined });
        }
        res.json({ ok: true, idempotent: saved.idempotent });
        return;
    }
    catch (e) {
        res.status(500).json({ error: "webhook_failed", message: e === null || e === void 0 ? void 0 : e.message });
        return;
    }
});
exports.webhook = webhook;
