// src/controllers/paypal.controller.ts
import { Request, Response } from "express";
import { paypalCreateOrder, paypalCaptureOrder } from "../utils/paypal";

export async function createOrder(req: Request, res: Response) {
  try {
    const { amount = "12.00", currency_code = "USD", description } = req.body || {};
    const order = await paypalCreateOrder(String(amount), String(currency_code), description);
    return res.status(201).json({ id: order.id });
  } catch (err: any) {
    console.error("PayPal create error:", err?.response?.data || err?.message);
    return res.status(500).json({ error: "No se pudo crear la orden de PayPal" });
  }
}

export async function captureOrder(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ error: "orderId requerido" });

    const capture = await paypalCaptureOrder(orderId);
    // TODO: aquí puedes marcar tu pedido como PAID en DB (idempotencia)
    return res.status(200).json(capture);
  } catch (err: any) {
    console.error("PayPal capture error:", err?.response?.data || err?.message);
    return res.status(500).json({ error: "No se pudo capturar la orden de PayPal" });
  }
}
