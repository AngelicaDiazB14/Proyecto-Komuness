// components/categoriaFilter.js
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../utils/api';

export const CategoriaFilter = () => {
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch(`${API_URL}/categorias`);
        const data = await response.json();
        setCategorias(data.data || []);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    };

    fetchCategorias();
  }, []);

  const handleCategoriaChange = (e) => {
    const categoriaId = e.target.value;
    setSelectedCategoria(categoriaId);
    
    const currentPath = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    
    if (categoriaId) {
      searchParams.set('categoria', categoriaId);
    } else {
      searchParams.delete('categoria');
    }
    
    navigate(`${currentPath}?${searchParams.toString()}`);
  };

  return (
   <div className="flex justify-end  bg-blue-900"> {/* Contenedor padre */}
    <div className="flex items-center gap-2 p-2 mb-4">
      <label className="text-yellow-400  p-2 font-bold text-sm">Categorías</label>
      <select
        value={selectedCategoria}
        onChange={handleCategoriaChange}
        className=" border rounded border-e-blue-900  p-2 bg-blue-900 text-gray-50 text-sm" 
      >
        <option value="">Todas las categorías</option>
        {categorias.map((categoria) => (
          <option key={categoria._id} value={categoria._id}>
            {categoria.nombre.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  </div>
  );
};

export default CategoriaFilter;