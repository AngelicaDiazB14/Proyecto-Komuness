// src/controllers/paypal.controller.ts
import type { RequestHandler } from "express";
import mongoose from "mongoose";
import {
  captureOrder,
  verifyWebhookSignature,
  extractPaymentInfo,
  extractUserId, // sigue para webhook
} from "../utils/paypal";
import { retryWithExponentialBackoff } from "../utils/paymentRetry";
import { PaymentErrorHandler } from "../utils/paymentErrorHandler";
import type { PaymentError, RetryHistoryEntry } from "../interfaces/payment.interface";
import { modelUsuario } from "../models/usuario.model"; // ⬅️ NUEVO

const USERS_COL = "usuarios"; // si tu colección se llama distinto, cámbiala aquí
const PAY_COL = "payments";   // auditoría/idempotencia

// (opcional) se deja por compatibilidad con webhook
async function setUserRolePremium(args: { id?: string; email?: string }) {
  const { id, email } = args;
  if (id) {
    await modelUsuario.findByIdAndUpdate(id, { $set: { tipoUsuario: 3 } }, { new: false });
    return;
  }
  if (email) {
    await modelUsuario.updateOne({ email }, { $set: { tipoUsuario: 3 } });
    return;
  }
}

async function savePayment(doc: any) {
  const col = mongoose.connection.collection(PAY_COL);
  try { await col.createIndex({ captureId: 1 }, { unique: true, sparse: true }); } catch {}
  try { await col.createIndex({ eventId: 1 },   { unique: true, sparse: true }); } catch {}
  try {
    await col.insertOne(doc);
    return { idempotent: false };
  } catch (e: any) {
    if (e?.code === 11000) return { idempotent: true };
    throw e;
  }
}

/** POST /api/paypal/capture  body: { orderId }  (requiere sesión via authMiddleware) */
export const captureAndUpgrade: RequestHandler = async (req, res): Promise<void> => {
  const retryHistory: RetryHistoryEntry[] = [];
  try {
    const { orderId } = req.body as { orderId?: string };
    if (!orderId) {
      res.status(400).json({ error: "orderId requerido" });
      return;
    }

    // ✅ Usuario desde la sesión
    const sessionUser = (req as any).user;
    if (!sessionUser?._id) {
      res.status(401).json({ error: "no_session_user", message: "Debes iniciar sesión." });
      return;
    }
    const sessionUserId = String(sessionUser._id);

    console.log(`[PayPal] Iniciando captura de orden: ${orderId} para usuario ${sessionUserId}`);

    const result = await retryWithExponentialBackoff(
      () => captureOrder(orderId),
      {
        maxRetries: 3,
        baseDelay: 1000,
        timeout: 30000,
        onRetry: (error: PaymentError, attemptNumber: number) => {
          console.log(`[PayPal] Reintento ${attemptNumber}: ${error.code} - ${error.message}`);
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

    if (!result.success) {
      const error = result.error!;
      const userMessage = PaymentErrorHandler.getUserMessage(error);
      const httpStatus = PaymentErrorHandler.getHttpStatusCode(error);

      try {
        await savePayment({
          orderId,
          status: 'FAILED',
          raw: { error: error.message, code: error.code },
          source: "capture",
          attemptNumber: result.attempts,
          lastError: error.message,
          retryHistory,
          userId: new mongoose.Types.ObjectId(sessionUserId),
        });
      } catch (saveError) {
        console.error('[PayPal] Error al guardar intento fallido:', saveError);
      }

      res.status(httpStatus).json({
        error: error.code,
        message: userMessage,
        canRetry: error.isRetryable,
        attempts: result.attempts,
      });
      return;
    }

    console.log(`[PayPal] ✓ Captura exitosa en ${result.attempts} intento(s)`);
    const data = result.data;
    const resource = data;
    const info = extractPaymentInfo(resource);

    const saved = await savePayment({
      orderId,
      captureId: info.captureId,
      status: info.status,
      value: info.value,
      currency: info.currency,
      payerId: info.payerId,
      email: info.email,
      userId: new mongoose.Types.ObjectId(sessionUserId),
      raw: data,
      source: "capture",
      attemptNumber: result.attempts,
      retryHistory: retryHistory.length > 0 ? retryHistory : undefined,
    });

    // ✅ Simple e idempotente: siempre set a Premium si COMPLETED/APPROVED (no depende de email/custom_id)
    if (info.status === "COMPLETED" || info.status === "APPROVED") {
      await modelUsuario.findByIdAndUpdate(sessionUserId, { $set: { tipoUsuario: 3 } }, { new: false });
      console.log(`[PayPal] Usuario actualizado a Premium (session): ${sessionUserId}`);
    }

    res.json({
      ok: true,
      status: info.status,
      idempotent: saved.idempotent,
      attempts: result.attempts,
    });
    return;
  } catch (e: any) {
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

    // Dejamos webhook como estaba (si tienes custom_id en la orden, también sube a premium)
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
