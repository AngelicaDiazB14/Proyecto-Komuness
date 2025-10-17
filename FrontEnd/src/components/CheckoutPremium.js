import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { toast } from 'react-hot-toast';
import { FiStar, FiCheck, FiArrowLeft, FiZap } from 'react-icons/fi';
import { API_URL } from '../utils/api';

const CheckoutPremium = () => {
  const navigate = useNavigate();
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const planes = {
    mensual: {
      id: 'mensual',
      nombre: 'Plan Mensual',
      precio: 4.00,
      periodo: 'mes',
      descripcion: 'Facturación mensual',
      badge: null,
    },
    anual: {
      id: 'anual',
      nombre: 'Plan Anual',
      precio: 8.00,
      periodo: 'año',
      descripcion: 'Facturación anual',
      badge: '33% OFF',
      precioComparacion: 12.00,
    },
  };

  const beneficios = [
    'Publicaciones adicionales tanto en eventos como en emprendimientos',
  ];

  const createOrder = async (data, actions) => {
    const plan = planes[planSeleccionado];
    const userId = localStorage.getItem('userId');

    return actions.order.create({
      purchase_units: [
        {
          description: `Komuness Premium - ${plan.nombre}`,
          amount: {
            currency_code: 'USD',
            value: plan.precio.toFixed(2),
          },
          custom_id: userId,
        },
      ],
      application_context: {
        shipping_preference: 'NO_SHIPPING',
      },
    });
  };

  const onApprove = async (data, actions) => {
    try {
      setProcesando(true);

      // Capturar la orden en PayPal
      await actions.order.capture();

      // Llamar al backend para registrar el pago
      const response = await fetch(`${API_URL}/paypal/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          orderId: data.orderID,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('¡Felicidades! Ahora eres usuario Premium 🎉', {
          duration: 5000,
        });

        // Esperar un poco para que el usuario vea el mensaje
        setTimeout(() => {
          navigate('/perfilUsuario');
        }, 2000);
      } else {
        throw new Error(result.message || 'Error al procesar el pago');
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      toast.error('Error al procesar el pago. Contacta con soporte.');
      setProcesando(false);
    }
  };

  const onError = (err) => {
    console.error('Error en PayPal:', err);
    toast.error('Error al procesar el pago. Intenta de nuevo.');
    setProcesando(false);
  };

  const onCancel = () => {
    toast('Pago cancelado', { icon: '❌' });
    setProcesando(false);
  };

  const paypalOptions = {
    'client-id': process.env.REACT_APP_PAYPAL_CLIENT_ID || 'sb',
    currency: 'USD',
    intent: 'capture',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <FiArrowLeft size={20} />
            Volver
          </button>

          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 rounded-full">
              <FiStar className="text-white" size={48} />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Actualiza a <span className="text-yellow-500">Premium</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Desbloquea todo el potencial de Komuness con publicaciones adicionales
          </p>
        </div>

        {/* Beneficios */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            ¿Qué incluye Premium?
          </h2>
          <div className="flex justify-center">
            {beneficios.map((beneficio, index) => (
              <div key={index} className="flex items-center gap-3 max-w-2xl">
                <div className="bg-green-100 rounded-full p-1">
                  <FiCheck className="text-green-600" size={16} />
                </div>
                <span className="text-gray-700 text-center">{beneficio}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Planes */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Plan Mensual */}
          <div
            className={`bg-white rounded-2xl shadow-lg p-8 cursor-pointer transition-all duration-300 ${
              planSeleccionado === 'mensual'
                ? 'ring-4 ring-blue-500 scale-105'
                : 'hover:shadow-xl hover:scale-102'
            }`}
            onClick={() => setPlanSeleccionado('mensual')}
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {planes.mensual.nombre}
              </h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-gray-900">
                  ${planes.mensual.precio}
                </span>
                <span className="text-gray-600">/ {planes.mensual.periodo}</span>
              </div>
              <p className="text-gray-500 mt-2">{planes.mensual.descripcion}</p>
            </div>

            {planSeleccionado === 'mensual' && (
              <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold mb-4">
                <FiCheck size={20} />
                Plan seleccionado
              </div>
            )}
          </div>

          {/* Plan Anual */}
          <div
            className={`bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-lg p-8 cursor-pointer transition-all duration-300 relative overflow-hidden ${
              planSeleccionado === 'anual'
                ? 'ring-4 ring-yellow-500 scale-105'
                : 'hover:shadow-xl hover:scale-102'
            }`}
            onClick={() => setPlanSeleccionado('anual')}
          >
            {/* Badge */}
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
              <FiZap size={14} />
              {planes.anual.badge}
            </div>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {planes.anual.nombre}
              </h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-gray-900">
                  ${planes.anual.precio}
                </span>
                <span className="text-gray-600">/ {planes.anual.periodo}</span>
              </div>
              <p className="text-gray-500 mt-2">{planes.anual.descripcion}</p>
              <p className="text-sm text-gray-600 mt-1 line-through">
                ${planes.anual.precioComparacion} al año
              </p>
            </div>

            {planSeleccionado === 'anual' && (
              <div className="flex items-center justify-center gap-2 text-yellow-600 font-semibold mb-4">
                <FiCheck size={20} />
                Plan seleccionado
              </div>
            )}
          </div>
        </div>

        {/* Botones de PayPal */}
        {planSeleccionado && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              Completa tu pago
            </h3>
            <p className="text-center text-gray-600 mb-6">
              Seleccionaste el <span className="font-semibold">{planes[planSeleccionado].nombre}</span>
            </p>

            {procesando && (
              <div className="flex flex-col items-center gap-3 mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
                <p className="text-gray-600">Procesando pago...</p>
              </div>
            )}

            <div className="max-w-md mx-auto">
              <PayPalScriptProvider options={paypalOptions}>
                <PayPalButtons
                  style={{
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'rect',
                    label: 'paypal',
                  }}
                  createOrder={createOrder}
                  onApprove={onApprove}
                  onError={onError}
                  onCancel={onCancel}
                  disabled={procesando}
                />
              </PayPalScriptProvider>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Pago seguro procesado por PayPal</p>
              <p className="mt-1">Tus datos están protegidos</p>
            </div>
          </div>
        )}

        {!planSeleccionado && (
          <div className="text-center text-gray-600 bg-white rounded-2xl shadow-lg p-8">
            <FiStar className="mx-auto mb-3 text-yellow-500" size={48} />
            <p className="text-lg">Selecciona un plan para continuar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPremium;
