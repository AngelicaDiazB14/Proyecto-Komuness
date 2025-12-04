// nuevaContra.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/api';
import { useAuth } from './context/AuthContext';

export const NuevaContra = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !user._id) {
      toast.error('Debes iniciar sesión para cambiar tu contraseña');
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (!nuevaContrasena.trim()) {
      toast.error('La nueva contraseña no puede estar vacía');
      return;
    }

    try {
      setCargando(true);

      const res = await fetch(`${API_URL}/usuario/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ password: nuevaContrasena }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Error al actualizar contraseña');
      }

      toast.success('Contraseña actualizada con éxito');

      // Opcional: redirigir a login o perfil
      setTimeout(() => {
        navigate('/iniciarSesion');
      }, 1500);
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      toast.error(err.message || 'No se pudo cambiar la contraseña');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-800/80 px-6 py-20">
      <div className="w-full max-w-xl bg-[#12143d] text-[#f0f0f0] rounded-2xl shadow-2xl p-10">
        <h2 className="text-4xl font-bold mb-6 text-center text-[#ffbf30]">
          Nueva Contraseña
        </h2>
        <p className="text-sm text-center mb-8 text-[#f0f0f0]">
          Ingresa tu nueva contraseña para actualizarla.
        </p>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="new-password" className="block text-base mb-2">
              Introduzca Nueva Contraseña
            </label>
            <input
              id="new-password"
              type="password"
              placeholder="Nueva contraseña"
              className="w-full px-5 py-3 rounded-xl bg-[#404270] border-none text-[#f0f0f0] focus:ring-2 focus:ring-[#5445ff] outline-none"
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-base mb-2">
              Repita la Nueva Contraseña
            </label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Repetir contraseña"
              className="w-full px-5 py-3 rounded-xl bg-[#404270] border-none text-[#f0f0f0] focus:ring-2 focus:ring-[#5445ff] outline-none"
              value={confirmarContrasena}
              onChange={(e) => setConfirmarContrasena(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-[#5445ff] hover:bg-[#4032cc] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-lg"
          >
            {cargando ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>
        <p className="mt-6 text-sm text-center">
          ¿Recordaste tu contraseña?{' '}
          <a href="/iniciarSesion" className="text-[#ffbf30] font-medium">
            Inicia Sesión
          </a>
        </p>
      </div>
    </div>
  );
};

export default NuevaContra;
