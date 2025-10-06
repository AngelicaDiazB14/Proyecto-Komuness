// src/components/payments/PaypalPayment.jsx
import React from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { API_URL } from "../../utils/api"; // ya tienes API_URL ahí

export default function PaypalPayment() {
  const initialOptions = {
    "client-id": process.env.REACT_APP_PAYPAL_CLIENTID,
    currency: "USD",
    intent: "capture",
  };

  const onCreateOrder = async () => {
    const res = await fetch(`${API_URL}/paypal/createorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: "12.00", currency_code: "USD" }),
      credentials: "include",
    });
    if (!res.ok) throw new Error("No se pudo crear la orden");
    const data = await res.json();
    return data.id;
  };

  const onApprove = async (data) => {
    const res = await fetch(`${API_URL}/paypal/capture/${data.orderID}`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Fallo la captura");
    // navega a tu pantalla de éxito si deseas
    alert("Pago capturado correctamente");
  };

  const onError = () => {
    alert("Error procesando el pago");
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalButtons createOrder={onCreateOrder} onApprove={onApprove} onError={onError} />
    </PayPalScriptProvider>
  );
}
