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
import type {
  PaymentError,
  RetryHistoryEntry,
} from "../interfaces/payment.interface";

import { modelConfiguracion } from "../models/configuracion.model";

const USERS_COL = "usuarios"; // cambia si tu colección de usuarios tiene otro nombre
const PAY_COL = "payments";   // colección de auditoría/idempotencia

// AGREGADO PARA EL VENCIMIENTO
type PlanType = "mensual" | "anual";

// AGREGADO PARA EL VENCIMIENTO
const PLAN_DAYS: Record<PlanType, number> = {
  mensual: 30,
  anual: 365,
};

// AGREGADO PARA EL VENCIMIENTO
async function setUserRolePremium(args: { id?: string; email?: string; plan?: PlanType }) {
  const { id, email, plan } = args;
  const users = mongoose.connection.collection(USERS_COL);

  const filter: any = {};
  if (id) {
    filter._id = new mongoose.Types.ObjectId(id);
  } else if (email) {
    filter.email = email;
  } else {
    console.warn(
      "[PayPal] setUserRolePremium llamado sin id ni email. No se actualizó ningún usuario."
    );
    return;
  }

  const userDoc = await users.findOne(filter);
  if (!userDoc) {
    console.warn(
      "[PayPal] Usuario no encontrado para setUserRolePremium:",
      filter
    );
    return;
  }

  const now = new Date();
  const daysToAdd =
    plan && PLAN_DAYS[plan] ? PLAN_DAYS[plan] : PLAN_DAYS.mensual;

  let baseDate = now;
  const existing = (userDoc as any).fechaVencimientoPremium as Date | undefined;
  if (existing instanceof Date && existing > now) {
    baseDate = existing;
  }

  const nuevaFecha = new Date(baseDate.getTime());
  nuevaFecha.setDate(nuevaFecha.getDate() + daysToAdd);

  const update: any = {
    $set: {
      tipoUsuario: 3,
      fechaVencimientoPremium: nuevaFecha,
    },
  };

  const result = await users.updateOne(filter, update);
  console.log("[PayPal] setUserRolePremium:", {
    filter,
    matched: result.matchedCount,
    modified: result.modifiedCount,
    nuevaFecha,
    plan: plan || "mensual",
  });
}

async function savePayment(doc: any) {
  const col = mongoose.connection.collection(PAY_COL);
  // índices para idempotencia (si ya existen, ignora el error)
  try {
    await col.createIndex({ captureId: 1 }, { unique: true, sparse: true });
  } catch {}
  try {
    await col.createIndex({ eventId: 1 }, { unique: true, sparse: true });
  } catch {}
  try {
    await col.insertOne(doc);
    return { idempotent: false };
  } catch (e: any) {
    if (e?.code === 11000) return { idempotent: true }; // duplicado
    throw e;
  }
}

// Función para obtener montos de configuración
async function getMontosConfigurados(): Promise<{ mensual: number; anual: number }> {
  try {
    const configs = await modelConfiguracion.find({
      clave: { $in: ['plan_mensual_monto', 'plan_anual_monto'] }
    }).lean();

    const montos = {
      mensual: 4.0,
      anual: 8.0
    };

    configs.forEach(config => {
      if (config.clave === 'plan_mensual_monto') {
        montos.mensual = Number(config.valor) || 4.0;
      } else if (config.clave === 'plan_anual_monto') {
        montos.anual = Number(config.valor) || 8.0;
      }
    });

    return montos;
  } catch (error) {
    console.error('[PayPal] Error al obtener montos configurados:', error);
    return { mensual: 4.0, anual: 8.0 };
  }
}

/** POST /api/paypal/capture  body: { orderId, plan? }  */
export const captureAndUpgrade: RequestHandler = async (
  req,
  res
): Promise<void> => {
  const retryHistory: RetryHistoryEntry[] = [];

  try {
    // AGREGADO PARA EL VENCIMIENTO
    const { orderId, plan: bodyPlan } = req.body as {
      orderId?: string;
      plan?: PlanType;
    };

    if (!orderId) {
      res.status(400).json({ error: "orderId requerido" });
      return;
    }

    // 🔐 Usuario autenticado en tu sistema (NO el de PayPal)
    const authReq = req as any;
    const loggedUserId: string | undefined =
      authReq.user?._id?.toString?.() ||
      authReq.user?._id ||
      authReq.userId ||
      authReq.user?.id;

    console.log("[PayPal] Usuario autenticado asociado a este pago:", loggedUserId);

    // Obtener montos configurados
    const montosConfigurados = await getMontosConfigurados();

    // Ejecutar captureOrder con sistema de reintentos
    const result = await retryWithExponentialBackoff(
      () => captureOrder(orderId),
      {
        maxRetries: 3,
        baseDelay: 1000, // 1 segundo
        timeout: 30000,  // 30 segundos
        onRetry: (error: PaymentError, attemptNumber: number) => {
          // Loggear cada reintento
          console.log(
            `[PayPal] Reintento ${attemptNumber}: ${error.code} - ${error.message}`
          );

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

      console.error(
        `[PayPal] Captura fallida después de ${result.attempts} intentos:`,
        error.code
      );

      // Guardar intento fallido en la base de datos para auditoría
      try {
        await savePayment({
          orderId,
          status: "FAILED",
          raw: { error: error.message, code: error.code },
          source: "capture",
          attemptNumber: result.attempts,
          lastError: error.message,
          retryHistory,
          userId: loggedUserId
            ? new mongoose.Types.ObjectId(loggedUserId)
            : undefined,
        });
      } catch (saveError) {
        console.error("[PayPal] Error al guardar intento fallido:", saveError);
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
    console.log(
      `[PayPal] ✓ Captura exitosa en ${result.attempts} intento(s)`
    );

    const data = result.data;
    const resource = data;
    const info = extractPaymentInfo(resource);

    // AGREGADO PARA EL VENCIMIENTO
    // Determinar plan (mensual/anual) a partir del body o del monto
    let effectivePlan: PlanType = "mensual";
    if (bodyPlan === "mensual" || bodyPlan === "anual") {
      effectivePlan = bodyPlan;
    } else {
      const rawValue = (info as any).value;
      const amount =
        typeof rawValue === "string"
          ? parseFloat(rawValue)
          : typeof rawValue === "number"
          ? rawValue
          : Number(rawValue);
      
      // Usar montos configurados para determinar el plan
      if (!Number.isNaN(amount) && amount >= montosConfigurados.anual) {
        effectivePlan = "anual";
      } else if (amount >= montosConfigurados.mensual) {
        effectivePlan = "mensual";
      }
    }

    const paypalUserId: string | undefined =
      extractUserId(resource) ?? undefined;

    const saved = await savePayment({
      orderId,
      captureId: info.captureId,
      status: info.status,
      value: info.value,
      currency: info.currency,
      payerId: info.payerId,
      email: info.email,
      userId: loggedUserId
        ? new mongoose.Types.ObjectId(loggedUserId)
        : undefined,
      raw: data,
      source: "capture",
      attemptNumber: result.attempts,
      retryHistory: retryHistory.length > 0 ? retryHistory : undefined,
      paypalUserId, // por si quieres auditar
    });

    // Solo actualizar usuario a Premium si el pago fue completado y no es duplicado
    if (
      (info.status === "COMPLETED" || info.status === "APPROVED") &&
      !saved.idempotent
    ) {
      if (!loggedUserId) {
        console.warn(
          "[PayPal] Pago completado pero no se encontró usuario autenticado para subir a Premium."
        );
      } else {
         // AGREGADO PARA EL VENCIMIENTO
        await setUserRolePremium({ id: loggedUserId, plan: effectivePlan });
        console.log(
          `[PayPal] Usuario actualizado a Premium (por capture): ${loggedUserId} con plan ${effectivePlan}`
        );
      }
    }

    res.json({
      ok: true,
      status: info.status,
      idempotent: saved.idempotent,
      attempts: result.attempts,
      // AGREGADO PARA EL VENCIMIENTO
      plan: effectivePlan,
      monto: info.value,
      montoEsperado: effectivePlan === 'anual' ? montosConfigurados.anual : montosConfigurados.mensual
    });
    return;
  } catch (e: any) {
    // Error inesperado no manejado por el sistema de reintentos
    console.error(
      "[PayPal] Error inesperado en captureAndUpgrade:",
      e?.message || e
    );
    res.status(500).json({
      error: "capture_failed",
      message:
        "Ocurrió un error inesperado al procesar el pago. Por favor, intenta nuevamente.",
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
      orderId:
        resource?.id || resource?.supplementary_data?.related_ids?.order_id,
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

    // AGREGADO PARA EL VENCIMIENTO
    // El upgrade a Premium ahora se hace únicamente en /api/paypal/capture
    // para evitar sumar días de más cuando también llega el webhook del mismo pago.
    res.json({ ok: true, idempotent: saved.idempotent });
    return;
  } catch (e: any) {
    console.error("[PayPal] Error en webhook:", e?.message || e);
    res.status(500).json({ error: "webhook_failed", message: e?.message });
    return;
  }
};
