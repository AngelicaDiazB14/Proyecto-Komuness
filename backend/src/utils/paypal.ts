// src/utils/paypal.ts
import axios from "axios";

const BASE_URL = process.env.PAYPAL_BASEURL || "https://api-m.sandbox.paypal.com";
const CLIENT_ID = process.env.PAYPAL_CLIENTID || "";
const SECRET = process.env.PAYPAL_SECRET || "";

function assertCreds() {
  if (!CLIENT_ID || !SECRET) {
    throw new Error("PAYPAL_CLIENTID o PAYPAL_SECRET no configurados");
  }
}

async function getAccessToken(): Promise<string> {
  assertCreds();
  const body = new URLSearchParams();
  body.append("grant_type", "client_credentials");

  const { data } = await axios.post(`${BASE_URL}/v1/oauth2/token`, body, {
    auth: { username: CLIENT_ID, password: SECRET },
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return data.access_token as string;
}

export async function paypalCreateOrder(amount: string, currency_code = "USD", description?: string) {
  const accessToken = await getAccessToken();

  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: { currency_code, value: amount },
        description,
      },
    ],
    application_context: {
      shipping_preference: "NO_SHIPPING",
      user_action: "PAY_NOW",
      brand_name: process.env.APP_BRAND_NAME || "Komuness",
    },
  };

  const { data } = await axios.post(`${BASE_URL}/v2/checkout/orders`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return data; // incluye { id }
}

export async function paypalCaptureOrder(orderId: string) {
  const accessToken = await getAccessToken();

  const { data } = await axios.post(
    `${BASE_URL}/v2/checkout/orders/${orderId}/capture`,
    {},
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return data;
}
