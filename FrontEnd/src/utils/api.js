// src/utils/api.js

// Detectar si estamos en desarrollo
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.port === '3000' ||
                     window.location.port === '3001';

// URL base original (como estaba antes)
// FORZAR siempre el dominio correcto, no usar window.location.origin
const RAW = process.env.REACT_APP_BACKEND_URL || 'https://komuness.duckdns.org';
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

// URL ESPECÍFICA para banco de profesionales - FORZAR localhost:5000 en desarrollo
export const PROFESIONALES_API_URL = isDevelopment 
  ? 'http://localhost:5000/api' 
  : `${BASE_URL}/api`;

// Debugging
console.log(' Entorno:', isDevelopment ? 'Desarrollo' : 'Producción');
console.log('API URL Original (biblioteca):', API_URL);
console.log('API URL Profesionales:', PROFESIONALES_API_URL);
console.log('BASE URL (archivos):', BASE_URL);
console.log('Host actual:', window.location.host);

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
