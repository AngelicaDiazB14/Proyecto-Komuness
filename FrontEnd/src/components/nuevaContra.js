import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../utils/api";
import { toast } from "react-hot-toast";

export const NuevaContra = () => {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Limpio toasts anteriores
    toast.dismiss();

    // Validaciones simples en front
    if (!newPassword || !confirmPassword) {
      toast.error("Debes llenar ambos campos de contraseña.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    // Tomar usuario y token desde localStorage
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");

    if (!user || !user._id || !token) {
      toast.error("No hay sesión activa. Vuelve a iniciar sesión.");
      navigate("/iniciarSesion");
      return;
    }

    setCargando(true);

    try {
      const res = await fetch(`${API_URL}/usuario/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || `Error ${res.status} al cambiar contraseña`);
      }

      toast.success("Contraseña actualizada correctamente ✅");

      // Opcional: limpiar campos
      setNewPassword("");
      setConfirmPassword("");

      // Redirigir después de un momento
      setTimeout(() => {
        navigate("/perfilUsuario");
      }, 1500);
    } catch (error) {
      console.error("Error al actualizar contraseña:", error);
      toast.error(error.message || "Error al actualizar la contraseña.");
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
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-5 py-3 rounded-xl bg-[#404270] border-none text-[#f0f0f0] focus:ring-2 focus:ring-[#5445ff] outline-none"
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-5 py-3 rounded-xl bg-[#404270] border-none text-[#f0f0f0] focus:ring-2 focus:ring-[#5445ff] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className={`w-full bg-[#5445ff] hover:bg-[#4032cc] text-white font-semibold rounded-xl py-3 text-lg ${
              cargando ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {cargando ? "Actualizando..." : "Actualizar Contraseña"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center">
          ¿Recordaste tu contraseña?{" "}
          <a href="/iniciarSesion" className="text-[#ffbf30] font-medium">
            Inicia Sesión
          </a>
        </p>
      </div>
    </div>
  );
};

export default NuevaContra;
