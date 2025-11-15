import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPhone, FaMapMarkerAlt, FaBriefcase, FaGraduationCap, FaGlobe, FaLinkedin, FaFacebook, FaInstagram, FaTwitter, FaArrowLeft, FaEnvelope } from 'react-icons/fa';
import { API_URL, BASE_URL } from '../utils/api';
import '../CSS/perfilPublico.css';

const PerfilPublico = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const obtenerPerfil = async () => {
      try {
        const response = await fetch(`${API_URL}/perfil/${id}`);
        
        if (!response.ok) {
          throw new Error('No se pudo cargar el perfil');
        }

        const data = await response.json();
        console.log('Perfil recibido:', data); // Debug
        
        // Asegurarse de que redesSociales existe
        const perfilData = data.data || data;
        if (!perfilData.redesSociales) {
          perfilData.redesSociales = {};
        }
        
        setPerfil(perfilData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    obtenerPerfil();
  }, [id]);

  if (loading) {
    return (
      <div className="perfil-loading">
        <div className="spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FaArrowLeft />
            <span>Volver</span>
          </button>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Usuario sin perfil público</h2>
            <p className="text-sm sm:text-base text-gray-600">Este usuario aún no ha creado su perfil público o no está disponible.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FaArrowLeft />
            <span>Volver</span>
          </button>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Usuario sin perfil público</h2>
            <p className="text-sm sm:text-base text-gray-600">Este usuario aún no ha creado su perfil público.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Botón de regresar */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 sm:mb-6 flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <FaArrowLeft className="text-sm sm:text-base" />
          <span>Volver</span>
        </button>

        {/* Header con Foto y Nombre */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6">
            <div className="flex-shrink-0">
              {perfil.fotoPerfil ? (
                <img
                  src={`${BASE_URL}${perfil.fotoPerfil}`}
                  alt={`${perfil.nombre} ${perfil.apellidos}`}
                  className="w-40 h-40 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-5xl font-bold">
                  {perfil.nombre?.charAt(0) || '?'}
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {perfil.nombre} {perfil.apellidos}
              </h1>
              <p className="text-base sm:text-lg text-green-600 mb-3 sm:mb-4 flex items-center gap-2 justify-center md:justify-start flex-wrap">
                <span className="flex items-center gap-2">
                  {perfil.ocupacionPrincipal || perfil.titulo || 'Profesional'}
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </span>
              </p>

              {perfil.descripcion && (
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-3 sm:mb-4">{perfil.descripcion}</p>
              )}

              {/* Badge de Especialidad */}
              {perfil.especialidad && (
                <div className="inline-block px-4 sm:px-6 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-full font-semibold text-sm sm:text-base mb-3 sm:mb-4">
                  {perfil.especialidad}
                </div>
              )}

              {perfil.cvUrl && (
                <div className="mt-3 sm:mt-4">
                  <a
                    href={`${BASE_URL}${perfil.cvUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 sm:px-6 py-1.5 sm:py-2 border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    📄 Descargar CV
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid de Dos Columnas */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {/* Columna Izquierda - Experiencia y Formación */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
            {/* Experiencia Profesional */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-blue-600">
                <FaBriefcase className="text-base sm:text-lg" /> 
                <span>Experiencia Profesional</span>
              </h2>
              {perfil.experienciaLaboral && perfil.experienciaLaboral.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {perfil.experienciaLaboral.map((exp, index) => (
                    <div key={index} className="border-l-2 border-blue-500 pl-3 sm:pl-4">
                      <h3 className="font-bold text-base sm:text-lg text-gray-900">{exp.cargo || exp.puesto}</h3>
                      <p className="text-sm sm:text-base text-gray-700 font-medium">{exp.empresa}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {exp.añoInicio || exp.fechaInicio} - {exp.añoFin || exp.fechaFin || 'Presente'}
                      </p>
                      {exp.descripcion && (
                        <p className="mt-1 sm:mt-2 text-gray-600 text-xs sm:text-sm">{exp.descripcion}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : perfil.ocupacionPrincipal ? (
                <div className="border-l-2 border-blue-500 pl-3 sm:pl-4">
                  <h3 className="font-bold text-base sm:text-lg text-gray-900">{perfil.ocupacionPrincipal}</h3>
                  <p className="text-gray-500 text-xs sm:text-sm">Ocupación actual</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No hay experiencia registrada</p>
              )}
            </div>

            {/* Formación Académica */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-blue-600">
                <FaGraduationCap className="text-base sm:text-lg" /> 
                <span>Formación:</span>
              </h2>
              {perfil.formacionAcademica && perfil.formacionAcademica.length > 0 ? (
                <ul className="list-disc list-inside space-y-1.5 sm:space-y-2">
                  {perfil.formacionAcademica.map((edu, index) => (
                    <li key={index} className="text-sm sm:text-base text-gray-700">
                      {edu.titulo} - {edu.institucion}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No hay formación registrada</p>
              )}
            </div>
          </div>

          {/* Columna Derecha - Información de Contacto */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-blue-600">Información de Contacto</h2>
            <div className="space-y-3 sm:space-y-4">
              {perfil.correoSecundario && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <FaEnvelope className="text-blue-600 flex-shrink-0" size={16} />
                  <a 
                    href={`mailto:${perfil.correoSecundario}`}
                    className="text-blue-600 hover:text-blue-700 transition-colors hover:underline text-sm sm:text-base break-all"
                  >
                    {perfil.correoSecundario}
                  </a>
                </div>
              )}
              {perfil.telefono && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <FaPhone className="text-blue-600 flex-shrink-0" size={16} />
                  <span className="text-sm sm:text-base text-gray-700">{perfil.telefono}</span>
                </div>
              )}
              {(perfil.canton || perfil.provincia) && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <FaMapMarkerAlt className="text-blue-600 flex-shrink-0" size={16} />
                  <span className="text-sm sm:text-base text-gray-700">
                    {perfil.canton && perfil.provincia 
                      ? `${perfil.canton}, ${perfil.provincia}`
                      : perfil.canton || perfil.provincia
                    }
                  </span>
                </div>
              )}
              {perfil.urlPortafolio && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <FaGlobe className="text-blue-600 flex-shrink-0" size={16} />
                  <a 
                    href={perfil.urlPortafolio} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 transition-colors hover:underline text-sm sm:text-base break-all"
                  >
                    Portafolio
                  </a>
                </div>
              )}
            </div>

            {/* Redes Sociales */}
            {perfil.redesSociales && Object.values(perfil.redesSociales).some(val => val) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-base sm:text-lg font-bold mb-3 text-blue-600">Redes Sociales</h3>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {perfil.redesSociales.linkedin && (
                    <a 
                      href={perfil.redesSociales.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <FaLinkedin size={20} className="sm:w-6 sm:h-6" />
                    </a>
                  )}
                  {perfil.redesSociales.facebook && (
                    <a 
                      href={perfil.redesSociales.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <FaFacebook size={20} className="sm:w-6 sm:h-6" />
                    </a>
                  )}
                  {perfil.redesSociales.instagram && (
                    <a 
                      href={perfil.redesSociales.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:text-pink-700 transition-colors"
                    >
                      <FaInstagram size={20} className="sm:w-6 sm:h-6" />
                    </a>
                  )}
                  {perfil.redesSociales.twitter && (
                    <a 
                      href={perfil.redesSociales.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <FaTwitter size={20} className="sm:w-6 sm:h-6" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Habilidades */}
            {perfil.habilidades && perfil.habilidades.length > 0 && (
              <div className="mt-6 sm:mt-8">
                <h3 className="text-base sm:text-lg font-bold mb-3 text-blue-600">Habilidades</h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {perfil.habilidades.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200 text-xs sm:text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Proyectos */}
            {perfil.proyectos && perfil.proyectos.length > 0 && (
              <div className="mt-6 sm:mt-8">
                <h3 className="text-base sm:text-lg font-bold mb-3 text-blue-600">Proyectos</h3>
                <div className="space-y-2 sm:space-y-3">
                  {perfil.proyectos.map((proyecto, index) => (
                    <div key={index} className="bg-gray-50 p-2.5 sm:p-3 rounded border border-gray-200">
                      <h4 className="font-semibold mb-1 text-sm sm:text-base text-gray-900">{proyecto.nombre}</h4>
                      <p className="text-gray-600 text-xs sm:text-sm mb-2">{proyecto.descripcion}</p>
                      {proyecto.url && (
                        <a
                          href={proyecto.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm hover:underline break-all"
                        >
                          Ver proyecto →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfilPublico;
