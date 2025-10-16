// src/utils/api.js
// URL base del backend: usa REACT_APP_BACKEND_URL o el mismo origen de la página (si no está definida)
const API_BASE = (process.env.REACT_APP_BACKEND_URL || window.location.origin).replace(/\/+$/, '');
export const API_URL = `${API_BASE}/api`;

// hace una petición HTTP al backend
export const getCategoriaById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/categorias/${id}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    return null;
  }
};
