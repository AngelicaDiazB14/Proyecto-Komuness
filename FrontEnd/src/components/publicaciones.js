// src/components/publicaciones.js
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import '../CSS/publicaciones.css';
import PublicacionCard from './publicacionCard';
import FormularioPublicacion from '../pages/formulario';
import { useAuth } from './context/AuthContext';
import CategoriaFilter from './categoriaFilter';

// URL base del backend (usa .env en build o IP directa)
const API = process.env.REACT_APP_BACKEND_URL || 'http://159.54.148.238/api';

export const Publicaciones = ({ tag: propTag }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [mostrar, setMostrar] = useState(0);
  const [cards, setCards] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [categoriaFilter, setCategoriaFilter] = useState(null); // Añade este estado
  const [tag, setTag] = useState(propTag); // 
  const limite = 10; // cuántas publicaciones por página
  const [formulario, setFormulario] = useState(false);

  const { user } = useAuth();
  const [publicaciones, setPublicaciones] = useState([]);

  // Obtener categoría de los query parameters
  useEffect(() => {
    const categoriaId = searchParams.get('categoria');
    setCategoriaFilter(categoriaId);
  }, [searchParams]);

  // Cambia el "modo" según la ruta
  useEffect(() => {
      const path = location.pathname;
      let newTag = propTag; // ← Usa la prop directamente
      
      if (path === '/eventos') {
        setMostrar(0);
        newTag = 'evento';
      } else if (path === '/emprendimientos') {
        setMostrar(1);
        newTag = 'emprendimiento';
      } else if (path === '/publicaciones') {
        setMostrar(2);
        newTag = 'publicacion';
      } else if (path === '/perfilUsuario') {
        setMostrar(3);
        newTag = null;
      }
      
      setTag(newTag);
      setPublicaciones([]);
      setPaginaActual(1);
      setTotalPaginas(1);
    }, [location.pathname, propTag]);

  // Cuando hay tag definido o cambia el filtro de categoría, trae la primera página
  useEffect(() => {
    if (tag) {
      obtenerPublicaciones(tag, 1, limite, categoriaFilter);
    }
  }, [tag, categoriaFilter]);

  // Filtra localmente según "mostrar" (por si el backend devuelve mezcla)
  useEffect(() => {
    if (mostrar === 3) {
      setCards(publicaciones);
    } else {
      const newCards = publicaciones.filter((publicacion) => {
        if (mostrar === 0) return publicacion.tag === 'evento';
        if (mostrar === 1) return publicacion.tag === 'emprendimiento';
        return publicacion.tag === 'publicacion';
      });
      setCards(newCards);
    }
  }, [mostrar, publicaciones]);

  const obtenerPublicaciones = async (tag, page = 1, limit = limite, categoriaId = null) => {
    try {
      const offset = (page - 1) * limit;

      const params = new URLSearchParams();
      if (tag) params.set('tag', tag);
      params.set('offset', String(offset));
      params.set('limit', String(limit));
      params.set('publicado', 'true');
      
      // Añadir filtro por categoría si existe
      if (categoriaId) {
        params.set('categoria', categoriaId);
      }

      const resp = await fetch(`${API}/publicaciones?${params.toString()}`, {
        method: 'GET',
      });

      // Si el backend responde 404 cuando no hay resultados:
      if (resp.status === 404) {
        setPublicaciones([]);
        setPaginaActual(1);
        setTotalPaginas(1);
        return;
      }

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${text}`);
      }

      const data = await resp.json();
      setPublicaciones(data.data || []);
      setPaginaActual(page);
      setTotalPaginas(data.pagination?.pages ?? 1);
    } catch (error) {
      console.error('Error al obtener publicaciones:', error);
      // deja la UI en estado vacío en caso de error
      setPublicaciones([]);
      setPaginaActual(1);
      setTotalPaginas(1);
    }
  };

  return (
    <div className="bg-gray-800/80 pt-1 min-h-screen">
      <CategoriaFilter />
      <div className="card-container">
        {cards.length === 0 ? (
          <p className="text-white">No hay publicaciones para mostrar.</p>
        ) : (
          cards.map((publicacion) => (
            <PublicacionCard key={publicacion._id} publicacion={publicacion} />
          ))
        )}
      </div>

      <div className="w-full flex justify-center mt-6 gap-2 flex-wrap pb-6">
        {paginaActual > 1 && (
          <button
            onClick={() => obtenerPublicaciones(tag, paginaActual - 1, limite, categoriaFilter)}
            className="px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            « Anterior
          </button>
        )}

        {Array.from({ length: totalPaginas }, (_, i) => i + 1)
          .filter(
            (p) =>
              p === 1 ||
              p === totalPaginas ||
              (p >= paginaActual - 2 && p <= paginaActual + 2)
          )
          .map((p, i, arr) => (
            <React.Fragment key={p}>
              {i > 0 && p - arr[i - 1] > 1 && (
                <span className="px-2 py-1 text-gray-500">...</span>
              )}
              <button
                onClick={() => obtenerPublicaciones(tag, p, limite, categoriaFilter)}
                className={`px-3 py-1 rounded text-sm ${
                  p === paginaActual
                    ? 'bg-[#5445FF] text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {p}
              </button>
            </React.Fragment>
          ))}

        {paginaActual < totalPaginas && (
          <button
            onClick={() => obtenerPublicaciones(tag, paginaActual + 1, limite, categoriaFilter)}
            className="px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            Siguiente »
          </button>
        )}
      </div>

      <button
        onClick={() => {
          if (user) {
            setFormulario(true);
          } else {
            navigate('/iniciarSesion');
          }
        }}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 bg-blue-600 text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 z-50 flex items-center justify-center text-2xl"
      >
        +
      </button>

      <FormularioPublicacion
        isOpen={formulario}
        onClose={() => setFormulario(false)}
        openTag={tag}
      />
    </div>
  );
};

export default Publicaciones;
