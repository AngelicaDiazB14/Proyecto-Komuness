// src/utils/api.js

// Base de API robusta (evita /api/api)
const RAW = process.env.REACT_APP_BACKEND_URL || window.location.origin;
const BASE = (RAW || '').replace(/\/+$/, '');
export const API_URL = BASE.endsWith('/api') ? BASE : `${BASE}/api`;
export const BASE_URL = BASE; // URL base sin /api para archivos estáticos

// hace una petición HTTP al backend
export const getCategoriaById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/categorias/${id}`);
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    return null;
  }
};
