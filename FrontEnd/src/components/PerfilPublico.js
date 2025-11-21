import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { API_URL, BASE_URL } from '../utils/api'; // <-- AGREGADO BASE_URL
import '../CSS/perfilPublico.css';
import { 
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaLinkedin, FaTwitter, 
  FaInstagram, FaFacebook, FaDownload, FaMoon, FaSun, FaCheck, 
  FaStar, FaAward, FaBriefcase, FaGraduationCap, FaUser,
  FaProjectDiagram, FaGlobe
} from 'react-icons/fa';
// Asegúrate que en este archivo también tengas importados AiOutlineUser, AiOutlinePhone, AiOutlineEnvironment
// import { AiOutlineUser, AiOutlinePhone, AiOutlineEnvironment } from 'react-icons/ai';

const PerfilPublico = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const modo = searchParams.get('modo') || 'completo';
  
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    cargarPerfil();
  }, [id, modo]);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/perfil/${id}?modo=${modo}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Perfil no encontrado');
        } else if (response.status === 403) {
          throw new Error('Este perfil no es público');
        }
        throw new Error('Error al cargar el perfil');
      }

      const data = await response.json();
      setPerfil(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="perfil-error">
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/" className="btn-volver">Volver al inicio</Link>
      </div>
    );
  }

  if (!perfil) {
    return null;
  }

  // Vista completa
  return (
    <div className={`min-h-screen ${isDarkMode ? "dark bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Botón Dark Mode */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {isDarkMode ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-gray-600" />}
          </button>
        </div>

        {/* Header con foto y nombre */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
          {perfil.fotoPerfil ? (
            <img 
              src={`${BASE_URL}${perfil.fotoPerfil}`}   // <-- CAMBIADO A BASE_URL
              alt={`${perfil.nombre} ${perfil.apellidos}`}
              className="w-48 h-48 rounded-full object-cover shadow-lg border-4 border-white dark:border-gray-700"
            />
          ) : (
            <div className="w-48 h-48 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow-lg">
              <FaUser className="text-6xl text-gray-400" />
            </div>
          )}
          
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {perfil.nombre} {perfil.apellidos}
            </h1>
            {perfil.titulo && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl text-gray-600 dark:text-gray-300">{perfil.titulo}</span>
                {perfil.perfilPublico && <FaCheck className="text-green-500" />}
              </div>
            )}
            
            {perfil.ocupacionPrincipal && !perfil.titulo && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl text-gray-600 dark:text-gray-300">{perfil.ocupacionPrincipal}</span>
                {perfil.perfilPublico && <FaCheck className="text-green-500" />}
              </div>
            )}

            <div className="flex gap-4 flex-wrap">
              {perfil.correoSecundario && (
                <a 
                  href={`mailto:${perfil.correoSecundario}`}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
                >
                  Contactar
                </a>
              )}
              
              {perfil.cvUrl && (
                <a
                  href={`${BASE_URL}${perfil.cvUrl}`}  // <-- CAMBIADO A BASE_URL
                  download
                  className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 px-6 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <FaDownload /> Descargar CV
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Badges/Insignias */}
        {perfil.habilidades && perfil.habilidades.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-8">
            {perfil.habilidades.slice(0, 3).map((habilidad, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  index === 1 ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}
              >
                <span className="text-xl">
                  {index === 0 ? '🏆' : index === 1 ? '⭐' : '🤝'}
                </span>
                <span className="font-semibold">{habilidad}</span>
              </div>
            ))}
          </div>
        )}

        {/* Grid de información */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="perfil-publico-container">
            <div className="perfil-completo-grid">
              {/* Columna izquierda - Información principal */}
              <div className="perfil-columna-principal">
                <div className="perfil-card perfil-header-card">
                  <div className="perfil-foto-container-grande">
                    {perfil.fotoPerfil ? (
                      <img 
                        src={`${BASE_URL}${perfil.fotoPerfil}`}   // <-- CAMBIADO A BASE_URL
                        alt={`${perfil.nombre} ${perfil.apellidos}`}
                        className="perfil-foto-grande"
                      />
                    ) : (
                      <AiOutlineUser className="perfil-foto-placeholder-grande" />
                    )}
                  </div>
                  
                  <h1 className="perfil-nombre-completo">
                    {perfil.nombre} {perfil.apellidos}
                  </h1>
                  
                  {perfil.titulo && (
                    <p className="perfil-titulo">{perfil.titulo}</p>
                  )}
                  
                  {perfil.ocupacionPrincipal && (
                    <p className="perfil-ocupacion-completo">{perfil.ocupacionPrincipal}</p>
                  )}
                  
                  {perfil.especialidad && (
                    <div className="perfil-especialidad-badge">{perfil.especialidad}</div>
                  )}
                </div>

                {/* Información de contacto */}
                {(perfil.telefono || perfil.canton || perfil.provincia) && (
                  <div className="perfil-card">
                    <h2 className="perfil-section-title">Información de Contacto</h2>
                    
                    {perfil.telefono && (
                      <p className="perfil-contacto-item">
                        <AiOutlinePhone /> {perfil.telefono}
                      </p>
                    )}
                    
                    {(perfil.canton || perfil.provincia) && (
                      <p className="perfil-contacto-item">
                        <AiOutlineEnvironment />
                        {perfil.canton && perfil.provincia 
                          ? `${perfil.canton}, ${perfil.provincia}`
                          : perfil.canton || perfil.provincia
                        }
                      </p>
                    )}
                  </div>
                )}

                {/* Redes sociales */}
                {perfil.redesSociales && Object.values(perfil.redesSociales).some(val => val) && (
                  <div className="perfil-card">
                    <h2 className="perfil-section-title">Redes Sociales</h2>
                    <div className="perfil-redes-sociales">
                      {perfil.redesSociales.linkedin && (
                        <a href={perfil.redesSociales.linkedin} target="_blank" rel="noopener noreferrer" className="red-social-link linkedin">
                          <FaLinkedin /> LinkedIn
                        </a>
                      )}
                      {perfil.redesSociales.facebook && (
                        <a href={perfil.redesSociales.facebook} target="_blank" rel="noopener noreferrer" className="red-social-link facebook">
                          <FaFacebook /> Facebook
                        </a>
                      )}
                      {perfil.redesSociales.instagram && (
                        <a href={perfil.redesSociales.instagram} target="_blank" rel="noopener noreferrer" className="red-social-link instagram">
                          <FaInstagram /> Instagram
                        </a>
                      )}
                      {perfil.redesSociales.twitter && (
                        <a href={perfil.redesSociales.twitter} target="_blank" rel="noopener noreferrer" className="red-social-link twitter">
                          <FaTwitter /> Twitter
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Habilidades */}
                {perfil.habilidades && perfil.habilidades.length > 0 && (
                  <div className="perfil-card">
                    <h2 className="perfil-section-title">Habilidades</h2>
                    <div className="perfil-habilidades">
                      {perfil.habilidades.map((habilidad, index) => (
                        <span key={index} className="habilidad-badge">{habilidad}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Columna derecha - Experiencia y formación */}
              <div className="perfil-columna-secundaria">
                {/* Formación académica */}
                {perfil.formacionAcademica && perfil.formacionAcademica.length > 0 && (
                  <div className="perfil-card">
                    <h2 className="perfil-section-title">
                      <FaGraduationCap /> Formación Académica
                    </h2>
                    <div className="timeline">
                      {perfil.formacionAcademica.map((formacion, index) => (
                        <div key={index} className="timeline-item">
                          <div className="timeline-period">
                            {formacion.añoInicio} - {formacion.añoFin || 'Presente'}
                          </div>
                          <h3 className="timeline-title">{formacion.titulo}</h3>
                          <p className="timeline-institution">{formacion.institucion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experiencia laboral */}
                {perfil.experienciaLaboral && perfil.experienciaLaboral.length > 0 && (
                  <div className="perfil-card">
                    <h2 className="perfil-section-title">
                      <FaBriefcase /> Experiencia Laboral
                    </h2>
                    <div className="timeline">
                      {perfil.experienciaLaboral.map((experiencia, index) => (
                        <div key={index} className="timeline-item">
                          <div className="timeline-period">
                            {experiencia.añoInicio} - {experiencia.añoFin || 'Presente'}
                          </div>
                          <h3 className="timeline-title">{experiencia.cargo}</h3>
                          <p className="timeline-institution">{experiencia.empresa}</p>
                          {experiencia.descripcion && (
                            <p className="timeline-description">{experiencia.descripcion}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proyectos */}
                {perfil.proyectos && perfil.proyectos.length > 0 && (
                  <div className="perfil-card">
                    <h2 className="perfil-section-title">Proyectos</h2>
                    <div className="proyectos-lista">
                      {perfil.proyectos.map((proyecto, index) => (
                        <div key={index} className="proyecto-item">
                          <h3 className="proyecto-nombre">
                            <a href={proyecto.url} target="_blank" rel="noopener noreferrer">
                              {proyecto.nombre}
                            </a>
                          </h3>
                          {proyecto.descripcion && (
                            <p className="proyecto-descripcion">{proyecto.descripcion}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Portafolio */}
                {perfil.urlPortafolio && (
                  <div className="perfil-card">
                    <h2 className="perfil-section-title">Portafolio</h2>
                    <a 
                      href={perfil.urlPortafolio} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-portafolio"
                    >
                      Ver portafolio completo
                    </a>
                  </div>
                )}

                {/* CV descargable */}
                {perfil.cvUrl && (
                  <div className="perfil-card">
                    <h2 className="perfil-section-title">Currículum Vitae</h2>
                    <a 
                      href={`${BASE_URL}${perfil.cvUrl}`}  // <-- CAMBIADO A BASE_URL
                      download
                      className="btn-descargar-cv"
                    >
                      {/* Si quieres, aquí puedes usar FaDownload en lugar de FaFileDownload */}
                      Descargar CV
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfilPublico;
