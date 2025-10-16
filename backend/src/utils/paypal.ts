// src/utils/paypal.ts
import https from "node:https";
import { URL } from "node:url";

const BASE        = process.env.PAYPAL_BASEURL || "https://api-m.sandbox.paypal.com";
const CLIENT      = process.env.PAYPAL_CLIENTID || "";
const SECRET      = process.env.PAYPAL_SECRET  || "";
const WEBHOOK_ID  = process.env.PAYPAL_WEBHOOK_ID || "";

function need(cond: any, msg: string) { if (!cond) throw new Error(msg); }

function postRaw(urlStr: string, body: string | Buffer, headers: Record<string, string>) {
  return new Promise<any>((resolve, reject) => {
    const u = new URL(urlStr);
    const req = https.request(
      {
        method: "POST",
        hostname: u.hostname,
        path: u.pathname + (u.search || ""),
        headers: { "Content-Length": Buffer.byteLength(body), ...headers },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", d => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
        res.on("end", () => {
          const txt = Buffer.concat(chunks).toString("utf8");
          try { resolve(txt ? JSON.parse(txt) : {}); } catch { resolve({ raw: txt }); }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function postForm(urlStr: string, form: URLSearchParams, headers: Record<string, string> = {}) {
  return postRaw(urlStr, form.toString(), { "Content-Type": "application/x-www-form-urlencoded", ...headers });
}

function postJSON(urlStr: string, payload: any, headers: Record<string, string> = {}) {
  return postRaw(urlStr, JSON.stringify(payload ?? {}), { "Content-Type": "application/json", ...headers });
}

function h(headers: Record<string, any>, name: string) {
  const k = Object.keys(headers || {}).find(x => x.toLowerCase() === name.toLowerCase());
  return k ? headers[k] : undefined;
}

export async function getAccessToken(): Promise<string> {
  need(CLIENT && SECRET, "Faltan PAYPAL_CLIENTID / PAYPAL_SECRET");
  const basic = Buffer.from(`${CLIENT}:${SECRET}`).toString("base64");
  const data = await postForm(
    `${BASE}/v1/oauth2/token`,
    new URLSearchParams({ grant_type: "client_credentials" }),
    { Authorization: `Basic ${basic}` }
  );
  return data.access_token;
}

export async function captureOrder(orderId: string) {
  const token = await getAccessToken();
  return postJSON(`${BASE}/v2/checkout/orders/${orderId}/capture`, {}, {
    Authorization: `Bearer ${token}`,
  });
}

/** Verifica firma del webhook con la API oficial */
export async function verifyWebhookSignature(headers: Record<string, string>, body: any) {
  need(WEBHOOK_ID, "PAYPAL_WEBHOOK_ID no configurado");
  const token = await getAccessToken();
  const payload = {
    auth_algo:         h(headers, "paypal-auth-algo"),
    cert_url:          h(headers, "paypal-cert-url"),
    transmission_id:   h(headers, "paypal-transmission-id"),
    transmission_sig:  h(headers, "paypal-transmission-sig"),
    transmission_time: h(headers, "paypal-transmission-time"),
    webhook_id:        WEBHOOK_ID,
    webhook_event:     body,
  };
  const r = await postJSON(`${BASE}/v1/notifications/verify-webhook-signature`, payload, {
    Authorization: `Bearer ${token}`,
  });
  return r?.verification_status === "SUCCESS";
}

/** Recomiendo mandar userId en purchase_units[0].custom_id al crear la orden */
export function extractUserId(resource: any): string | undefined {
  try { return resource?.purchase_units?.[0]?.custom_id ?? undefined; }
  catch { return undefined; }
}

export function extractPaymentInfo(resource: any) {
  const cap     = resource?.purchase_units?.[0]?.payments?.captures?.[0];
  const amount  = cap?.amount || resource?.amount;
  const status  = resource?.status || cap?.status;
  const captureId = cap?.id || resource?.id;
  const payerId   = resource?.payer?.payer_id;
  const email     = resource?.payer?.email_address;
  return {
    status,
    currency: amount?.currency_code,
    value: amount?.value,
    captureId,
    payerId,
    email,
  };
}
