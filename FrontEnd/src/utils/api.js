export const API_URL = "http://159.54.148.238/api";


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