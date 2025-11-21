// src/utils/api.js

// URL que apunta al backend (con o sin /api, lo normalizamos)
const RAW = process.env.REACT_APP_BACKEND_URL || window.location.origin;
// quitamos slashes finales
let BASE = (RAW || '').replace(/\/+$/, '');

// Si viene con /api al final (ej: https://servidor.com/api), se lo quitamos
if (BASE.endsWith('/api')) {
  BASE = BASE.slice(0, -4); // elimina los últimos 4 caracteres: "/api"
}

// Ahora:
//   BASE_URL = raíz del backend (sin /api)
//   API_URL  = raíz de la API (con /api)
export const BASE_URL = BASE;           // p.ej. "https://servidor.com"
export const API_URL  = `${BASE_URL}/api`;

// hace una petición HTTP al backend (ejemplo existente)
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
