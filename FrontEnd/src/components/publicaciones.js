// src/components/publicaciones.js
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { IoMdArrowRoundBack } from "react-icons/io";
import '../CSS/publicaciones.css';
import PublicacionCard from './publicacionCard';
import FormularioPublicacion from '../pages/formulario';
import { useAuth } from './context/AuthContext';
import CategoriaFilter from './categoriaFilter';
import BuscadorPublicaciones from './buscadorPublicaciones';

// Base de API robusta (evita /api/api)
const RAW = process.env.REACT_APP_BACKEND_URL || window.location.origin;
const BASE = (RAW || '').replace(/\/+$/, '');
const API = BASE.endsWith('/api') ? BASE : `${BASE}/api`;

export const Publicaciones = ({ tag: propTag }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [mostrar, setMostrar] = useState(0);
  const [cards, setCards] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [categoriaFilter, setCategoriaFilter] = useState(null);
  const [searchFilter, setSearchFilter] = useState(null);
  const [tag, setTag] = useState(propTag);
  const limite = 12;
  const [formulario, setFormulario] = useState(false);

  const { user } = useAuth();
  const [publicaciones, setPublicaciones] = useState([]);

  useEffect(() => {
    const categoriaId = searchParams.get('categoria');
    const searchTerm = searchParams.get('q');
    const isSearch = searchParams.get('search') === 'true';
    
    setCategoriaFilter(categoriaId);
    setSearchFilter(isSearch ? searchTerm : null);
  }, [searchParams]);

  useEffect(() => {
    const path = location.pathname;
    let newTag = propTag;

    if (path === '/eventos') {
      setMostrar(0); newTag = 'evento';
    } else if (path === '/emprendimientos') {
      setMostrar(1); newTag = 'emprendimiento';
    } else if (path === '/publicaciones') {
      setMostrar(2); newTag = 'publicacion';
    } else if (path === '/perfilUsuario') {
      setMostrar(3); newTag = null;
    }

    setTag(newTag);
    setPublicaciones([]);
    setPaginaActual(1);
    setTotalPaginas(1);
  }, [location.pathname, propTag]);

  useEffect(() => {
    if (tag) obtenerPublicaciones(tag, 1, limite, categoriaFilter, searchFilter);
  }, [tag, categoriaFilter, searchFilter]);

  useEffect(() => {
    if (mostrar === 3) {
      setCards(publicaciones);
    } else {
      const newCards = publicaciones.filter((p) => {
        if (mostrar === 0) return p.tag === 'evento';
        if (mostrar === 1) return p.tag === 'emprendimiento';
        return p.tag === 'publicacion';
      });
      setCards(newCards);
    }
  }, [mostrar, publicaciones]);

  
const obtenerPublicaciones = async (tag, page = 1, limit = limite, categoriaId = null, searchTerm = null) => {
  try {
    const offset = (page - 1) * limit;
    
    let url;
    let params;
    
    if (searchTerm) {
      //  Usar search/advanced en lugar de /buscar para que popule categorías
      url = `${API}/publicaciones/search/advanced`;
      params = new URLSearchParams({
        q: searchTerm,
        offset: String(offset),
        limit: String(limit)
      });
      if (categoriaId) params.set('categoria', categoriaId);
    } else {
      // Usar búsqueda normal por tag
      url = `${API}/publicaciones`;
      params = new URLSearchParams({
        tag: tag || '',
        offset: String(offset),
        limit: String(limit),
        publicado: 'true'
      });
      if (categoriaId) params.set('categoria', categoriaId);
    }

    const resp = await fetch(`${url}?${params.toString()}`);
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
    
    // Para search/advanced, la estructura es { data: [], pagination: {} }
    setPublicaciones(data.data || []);
    setPaginaActual(page);
    setTotalPaginas(data.pagination?.pages ?? 1);
  } catch (error) {
    console.error('Error al obtener publicaciones:', error);
    setPublicaciones([]); 
    setPaginaActual(1); 
    setTotalPaginas(1);
  }
};

  const mostrarBotonVolver = () => {
    const path = location.pathname;
    return path === '/eventos' || path === '/emprendimientos';
  };

  const handlePagination = (newPage) => {
    obtenerPublicaciones(tag, newPage, limite, categoriaFilter, searchFilter);
  };

  return (
    <div className="bg-gray-800/80 pt-1 min-h-screen">
      <div className="relative">
        {/* Contenedor para filtros y buscador */}
        <div className="bg-blue-900">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            {/* Buscador */}
            <BuscadorPublicaciones />
            
            {/* Filtro de categorías */}
            <div className="md:ml-auto">
              <CategoriaFilter />
            </div>
          </div>
        </div>

        {mostrarBotonVolver() && (
          <div className="absolute top-4 left-10 z-20">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-md"
            >
              <IoMdArrowRoundBack color="black" size={21} />
            </button>
          </div>
        )}
      </div>

      {/* Mensaje de búsqueda */}
      {searchFilter && (
        <div className="px-4 pt-4">
          <div className="bg-blue-100 border border-blue-300 rounded p-3">
            <p className="text-blue-800 text-sm">
              Mostrando resultados para: <strong>"{searchFilter}"</strong>
              {publicaciones.length === 0 && ' - No se encontraron resultados'}
            </p>
          </div>
        </div>
      )}

      <div className="card-container">
        {cards.length === 0 ? (
          <p className="text-white">
            {searchFilter 
              ? 'No hay publicaciones que coincidan con tu búsqueda.' 
              : 'No hay publicaciones para mostrar.'
            }
          </p>
        ) : (
          cards.map((publicacion) => (
            <PublicacionCard key={publicacion._id} publicacion={publicacion} />
          ))
        )}
      </div>

      <div className="w-full flex justify-center mt-6 gap-2 flex-wrap pb-6">
        {paginaActual > 1 && (
          <button
            onClick={() => handlePagination(paginaActual - 1)}
            className="px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            « Anterior
          </button>
        )}

        {Array.from({ length: totalPaginas }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPaginas || (p >= paginaActual - 2 && p <= paginaActual + 2))
          .map((p, i, arr) => (
            <React.Fragment key={p}>
              {i > 0 && p - arr[i - 1] > 1 && (<span className="px-2 py-1 text-gray-500">...</span>)}
              <button
                onClick={() => handlePagination(p)}
                className={`px-3 py-1 rounded text-sm ${p === paginaActual ? 'bg-[#5445FF] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {p}
              </button>
            </React.Fragment>
          ))}

        {paginaActual < totalPaginas && (
          <button
            onClick={() => handlePagination(paginaActual + 1)}
            className="px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            Siguiente »
          </button>
        )}
      </div>

      <button
        onClick={() => { if (user) setFormulario(true); else navigate('/iniciarSesion'); }}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 bg-yellow-500 text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg hover:bg-yellow-700 transition-all duration-300 z-50 flex items-center justify-center text-2xl"
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
