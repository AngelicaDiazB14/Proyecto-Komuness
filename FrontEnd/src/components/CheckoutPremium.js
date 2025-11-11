import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { toast } from 'react-hot-toast';
import { FiStar, FiCheck, FiArrowLeft, FiZap, FiAlertCircle, FiRefreshCw, FiCheckCircle, FiXCircle, FiWifi, FiCreditCard, FiShield } from 'react-icons/fi';
import { API_URL } from '../utils/api';
import '../CSS/CheckoutPremium.css';

const CheckoutPremium = () => {
  const navigate = useNavigate();
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [reintentos, setReintentos] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

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
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user ? user._id : null;

    return actions.order.create({
      purchase_units: [{
          description: `Komuness Premium - ${plan.nombre}`,
          amount: { value: plan.precio.toFixed(2), currency_code: 'USD' },
          custom_id: userId // asocia la orden PayPal con el ID de usuario de MongoDB
      }],
      application_context: {
        shipping_preference: 'NO_SHIPPING',
      },
    });
  };

  const onApprove = async (data, actions) => {
    try {
      // Resetear estados
      setErrorMessage('');
      setReintentos(0);
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

      if (!response.ok) {
        // Extraer información del error
        const userMessage = result.message || 'Error al procesar el pago';
        const attempts = result.attempts || 1;

        // Actualizar estados
        setErrorMessage(userMessage);
        setReintentos(attempts);
        
        // Mostrar toast con el mensaje específico y animación
        toast.error(userMessage, { 
          duration: 6000,
          icon: '⚠️',
          style: {
            background: '#FEE2E2',
            color: '#991B1B',
            border: '2px solid #F87171',
            fontWeight: '600',
          }
        });
        
        setProcesando(false);
        return;
      }

      // Pago exitoso
      const attempts = result.attempts || 1;

      if (attempts > 1) {
        // Si hubo reintentos, mostrar mensaje especial
        toast.success(`¡Pago completado después de ${attempts} intentos! 🎉`, {
          duration: 5000,
          icon: '✨',
          style: {
            background: '#D1FAE5',
            color: '#065F46',
            border: '2px solid #34D399',
            fontWeight: '600',
          }
        });
      } else {
        // Pago exitoso en el primer intento
        toast.success('¡Felicidades! Ahora eres usuario Premium 🎉', {
          duration: 5000,
          icon: '🎉',
          style: {
            background: '#D1FAE5',
            color: '#065F46',
            border: '2px solid #34D399',
            fontWeight: '600',
          }
        });
      }

      // Esperar un poco para que el usuario vea el mensaje
      setTimeout(() => {
        navigate('/perfilUsuario');
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error al procesar el pago:', error);
      setErrorMessage('Ocurrió un error inesperado. Por favor, intenta nuevamente.');
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
            className={`plan-card bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-8 cursor-pointer transition-all duration-300 relative overflow-hidden ${
              planSeleccionado === 'mensual'
                ? 'ring-4 ring-blue-500 scale-105 animate-glow'
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
              <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold mb-4 animate-scale-in">
                <FiCheckCircle size={20} className="animate-pulse" />
                Plan seleccionado
              </div>
            )}
          </div>

          {/* Plan Anual */}
          <div
            className={`plan-card bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-lg p-8 cursor-pointer transition-all duration-300 relative overflow-hidden ${
              planSeleccionado === 'anual'
                ? 'ring-4 ring-yellow-500 scale-105 animate-glow'
                : 'hover:shadow-xl hover:scale-102'
            }`}
            onClick={() => setPlanSeleccionado('anual')}
          >
            {/* Badge */}
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 animate-bounce-soft">
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
              <div className="flex items-center justify-center gap-2 text-yellow-600 font-semibold mb-4 animate-scale-in">
                <FiCheckCircle size={20} className="animate-pulse" />
                Plan seleccionado
              </div>
            )}
          </div>
        </div>

        {/* Botones de PayPal */}
        {planSeleccionado && (
          <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">`
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              Completa tu pago
            </h3>
            <p className="text-center text-gray-600 mb-6">
              Seleccionaste el <span className="font-semibold">{planes[planSeleccionado].nombre}</span>
            </p>

            {procesando && (
              <div className="flex flex-col items-center gap-4 mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-lg animate-slide-down">
                {/* Spinner animado mejorado */}
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <FiCreditCard className="text-yellow-600 animate-pulse" size={24} />
                  </div>
                </div>

                {/* Mensaje principal */}
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800 flex items-center gap-2 justify-center">
                    <FiShield className="text-blue-600" />
                    Procesando pago seguro...
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Por favor no cierres esta ventana</p>
                </div>

                {/* Barra de progreso de reintentos */}
                {reintentos > 0 && (
                  <div className="w-full max-w-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-yellow-700 flex items-center gap-1">
                        <FiRefreshCw className="animate-spin" />
                        Reintentando conexión...
                      </span>
                      <span className="text-sm font-bold text-yellow-800">
                        Intento {reintentos}/3
                      </span>
                    </div>
                    
                    {/* Barra de progreso animada */}
                    <div className="w-full bg-yellow-200 rounded-full h-3 overflow-hidden shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-amber-500 h-3 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-1"
                        style={{ width: `${(reintentos / 3) * 100}%` }}
                      >
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    </div>

                    {/* Puntos de progreso */}
                    <div className="flex justify-between mt-2">
                      {[1, 2, 3].map((num) => (
                        <div 
                          key={num}
                          className={`flex items-center gap-1 text-xs font-medium transition-all duration-300 ${
                            num <= reintentos 
                              ? 'text-yellow-700 scale-110' 
                              : 'text-gray-400'
                          }`}
                        >
                          {num <= reintentos ? (
                            <FiCheckCircle className="animate-bounce" />
                          ) : (
                            <div className="w-3 h-3 border-2 border-current rounded-full"></div>
                          )}
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Indicador de conexión */}
                {reintentos > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 animate-pulse">
                    <FiWifi className="text-blue-500" />
                    Verificando conexión con PayPal...
                  </div>
                )}
              </div>
            )}

            {errorMessage && !procesando && (
              <div className="mb-6 animate-shake">
                {/* Caja de error mejorada con animación */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-6 shadow-lg">
                  {/* Icono y título */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                        <FiXCircle className="text-white" size={24} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-red-900 mb-1">
                        Error en el pago
                      </h4>
                      <p className="text-red-800 font-medium leading-relaxed">
                        {errorMessage}
                      </p>
                    </div>
                  </div>

                  {/* Información de reintentos */}
                  {reintentos > 1 && (
                    <div className="mt-4 pt-4 border-t-2 border-red-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FiRefreshCw className="text-red-600" />
                          <span className="text-sm font-semibold text-red-700">
                            Intentos realizados
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(3)].map((_, index) => (
                            <div
                              key={index}
                              className={`w-3 h-3 rounded-full ${
                                index < reintentos
                                  ? 'bg-red-500 animate-pulse'
                                  : 'bg-red-200'
                              }`}
                            ></div>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-red-600 mt-2">
                        El sistema intentó procesar el pago {reintentos} {reintentos === 1 ? 'vez' : 'veces'}
                      </p>
                    </div>
                  )}

                  {/* Sugerencias de acción */}
                  <div className="mt-4 p-3 bg-white rounded-lg border border-red-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <FiAlertCircle size={14} />
                      Qué puedes hacer:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1 ml-5 list-disc">
                      <li>Verifica tu conexión a internet</li>
                      <li>Comprueba que tu método de pago tenga fondos</li>
                      <li>Intenta con otro método de pago</li>
                      <li>Contacta con soporte si el problema persiste</li>
                    </ul>
                  </div>
                </div>
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
              <div className="flex items-center justify-center gap-2 mb-2">
                <FiShield className="text-green-600" />
                <p className="font-semibold text-gray-700">Pago 100% seguro</p>
              </div>
              <p className="text-xs text-gray-500">
                Procesado por PayPal · Tus datos están encriptados y protegidos
              </p>
            </div>
          </div>
        )}

        {!planSeleccionado && (
          <div className="text-center text-gray-600 bg-white rounded-2xl shadow-lg p-8">
            <FiStar className="mx-auto mb-3 text-yellow-500 animate-pulse" size={48} />
            <p className="text-lg font-semibold">Selecciona un plan para continuar</p>
            <p className="text-sm text-gray-500 mt-2">Elige entre nuestros planes mensual o anual</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPremium;
