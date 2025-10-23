// src/controllers/paypal.controller.ts
import type { RequestHandler } from "express";
import mongoose from "mongoose";
import {
  captureOrder,
  verifyWebhookSignature,
  extractPaymentInfo,
  extractUserId,
} from "../utils/paypal";
import { retryWithExponentialBackoff } from "../utils/paymentRetry";
import { PaymentErrorHandler } from "../utils/paymentErrorHandler";
import type { PaymentError, RetryHistoryEntry } from "../interfaces/payment.interface";

const USERS_COL = "usuarios"; // cambia si tu colección de usuarios tiene otro nombre
const PAY_COL = "payments";   // colección de auditoría/idempotencia

async function setUserRolePremium(args: { id?: string; email?: string }) {
  const { id, email } = args;
  const users = mongoose.connection.collection(USERS_COL);
  const update = { $set: { tipoUsuario: 3 } } as any; // PREMIUM = 3
  if (id) {
    await users.updateOne({ _id: new mongoose.Types.ObjectId(id) }, update);
    return;
  }
  if (email) {
    await users.updateOne({ email }, update);
    return;
  }
}

async function savePayment(doc: any) {
  const col = mongoose.connection.collection(PAY_COL);
  // índices para idempotencia (si ya existen, ignora el error)
  try { await col.createIndex({ captureId: 1 }, { unique: true, sparse: true }); } catch {}
  try { await col.createIndex({ eventId: 1 },   { unique: true, sparse: true }); } catch {}
  try {
    await col.insertOne(doc);
    return { idempotent: false };
  } catch (e: any) {
    if (e?.code === 11000) return { idempotent: true }; // duplicado
    throw e;
  }
}

/** POST /api/paypal/capture  body: { orderId }  (opcional) */
export const captureAndUpgrade: RequestHandler = async (req, res): Promise<void> => {
  const retryHistory: RetryHistoryEntry[] = [];
  
  try {
    const { orderId } = req.body as { orderId?: string };
    if (!orderId) {
      res.status(400).json({ error: "orderId requerido" });
      return;
    }

    console.log(`[PayPal] Iniciando captura de orden: ${orderId}`);

    // Ejecutar captureOrder con sistema de reintentos
    const result = await retryWithExponentialBackoff(
      () => captureOrder(orderId),
      {
        maxRetries: 3,
        baseDelay: 1000,    // 1 segundo
        timeout: 30000,     // 30 segundos
        onRetry: (error: PaymentError, attemptNumber: number) => {
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
      }
    );

    // Si la operación falló después de todos los reintentos
    if (!result.success) {
      const error = result.error!;
      const userMessage = PaymentErrorHandler.getUserMessage(error);
      const httpStatus = PaymentErrorHandler.getHttpStatusCode(error);

      console.error(`[PayPal] Captura fallida después de ${result.attempts} intentos:`, error.code);

      // Guardar intento fallido en la base de datos para auditoría
      try {
        await savePayment({
          orderId,
          status: 'FAILED',
          raw: { error: error.message, code: error.code },
          source: "capture",
          attemptNumber: result.attempts,
          lastError: error.message,
          retryHistory,
        });
      } catch (saveError) {
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
    const info = extractPaymentInfo(resource);
    const userId: string | undefined = extractUserId(resource) ?? undefined;

    const saved = await savePayment({
      orderId,
      captureId: info.captureId,
      status: info.status,
      value: info.value,
      currency: info.currency,
      payerId: info.payerId,
      email: info.email,
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      raw: data,
      source: "capture",
      attemptNumber: result.attempts,
      retryHistory: retryHistory.length > 0 ? retryHistory : undefined,
    });

    // Solo actualizar usuario a Premium si el pago fue completado y no es duplicado
    if ((info.status === "COMPLETED" || info.status === "APPROVED") && !saved.idempotent) {
      await setUserRolePremium({ id: userId, email: info.email ?? undefined });
      console.log(`[PayPal] Usuario actualizado a Premium: ${userId || info.email}`);
    }

    res.json({ 
      ok: true, 
      status: info.status, 
      idempotent: saved.idempotent,
      attempts: result.attempts,
    });
    return;
  } catch (e: any) {
    // Error inesperado no manejado por el sistema de reintentos
    console.error('[PayPal] Error inesperado en captureAndUpgrade:', e);
    res.status(500).json({ 
      error: "capture_failed", 
      message: "Ocurrió un error inesperado al procesar el pago. Por favor, intenta nuevamente.",
      attempts: 1,
    });
    return;
  }
};

/** POST /api/paypal/webhook  (URL configurada en PayPal) */
export const webhook: RequestHandler = async (req, res): Promise<void> => {
  try {
    const valid = await verifyWebhookSignature(req.headers as any, req.body);
    if (!valid) {
      res.status(400).json({ error: "invalid_signature" });
      return;
    }

    const event = req.body;
    const eventId: string | undefined = event?.id;
    const resource = event?.resource;
    const info = extractPaymentInfo(resource);
    const userId: string | undefined = extractUserId(resource) ?? undefined;

    const saved = await savePayment({
      eventId,
      orderId: resource?.id || resource?.supplementary_data?.related_ids?.order_id,
      captureId: info.captureId,
      status: info.status,
      value: info.value,
      currency: info.currency,
      payerId: info.payerId,
      email: info.email,
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      raw: event,
      source: "webhook",
      event_type: event?.event_type,
    });

    const okTypes = new Set(["PAYMENT.CAPTURE.COMPLETED", "CHECKOUT.ORDER.APPROVED"]);
    if (okTypes.has(event?.event_type) && (info.status === "COMPLETED" || info.status === "APPROVED") && !saved.idempotent) {
      await setUserRolePremium({ id: userId, email: info.email ?? undefined });
    }

    res.json({ ok: true, idempotent: saved.idempotent });
    return;
  } catch (e: any) {
    res.status(500).json({ error: "webhook_failed", message: e?.message });
    return;
  }
};
