// src/controllers/paypal.controller.ts
import type { RequestHandler } from "express";
import mongoose from "mongoose";
import {
  captureOrder,
  verifyWebhookSignature,
  extractPaymentInfo,
  extractUserId,
} from "../utils/paypal";

const USERS_COL = "usuarios"; // cambia si tu colección tiene otro nombre
const PAY_COL = "payments";   // registros de pagos e idempotencia

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
  // índices para idempotencia (se crean 1 vez; si existen, ignora error)
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

/** POST /api/paypal/capture  body: { orderId }  (opcional) */
export const captureAndUpgrade: RequestHandler = async (req, res) => {
  try {
    const { orderId } = req.body as { orderId?: string };
    if (!orderId) return res.status(400).json({ error: "orderId requerido" });

    const data = await captureOrder(orderId);
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
    });

    if ((info.status === "COMPLETED" || info.status === "APPROVED") && !saved.idempotent) {
      await setUserRolePremium({ id: userId, email: info.email ?? undefined });
    }

    return res.json({ ok: true, status: info.status, idempotent: saved.idempotent });
  } catch (e: any) {
    return res.status(500).json({ error: "capture_failed", message: e?.message });
  }
};

/** POST /api/paypal/webhook  (URL configurada en PayPal) */
export const webhook: RequestHandler = async (req, res) => {
  try {
    const valid = await verifyWebhookSignature(req.headers as any, req.body);
    if (!valid) return res.status(400).json({ error: "invalid_signature" });

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

    return res.json({ ok: true, idempotent: saved.idempotent });
  } catch (e: any) {
    return res.status(500).json({ error: "webhook_failed", message: e?.message });
  }
};
