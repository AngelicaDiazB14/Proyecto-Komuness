import { 
  IoMdArrowRoundBack, 
  IoMdCall, 
  IoMdLink, 
  IoMdPerson, 
  IoMdSchool, 
  IoMdStar, 
  IoMdMail,   
  IoLogoFacebook, 
  IoLogoInstagram, 
  IoLogoWhatsapp,
  IoMdCreate  
} from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { API_URL, getCategoriaById } from "../utils/api";
import { EditarPublicacionModal } from './EditarPublicacionModal';
import Slider from "./slider";
import ComentariosPub from "./comentariosPub";
import PublicacionModal from "./publicacionModal";
import { useAuth } from "./context/AuthContext";
import CategoriaBadge from "./categoriaBadge";

export const PublicacionDetalle = () => {
  const navigate = useNavigate();
  
  const { user } = useAuth();

  // ========== FUNCIÓN FORMATFECHA CORREGIDA ==========
   // MODIFICACIÓN: Se corrigió el problema de zona horaria
  // que causaba que las fechas se mostraran un día después
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "Sin fecha";
    
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    
    let fecha;
    
    // Si la fecha viene en formato dd/mm/yyyy
    if (fechaStr.includes("/")) {
      const partes = fechaStr.split("/");
      if (partes.length === 3) {
        // CAMBIO: Crear fecha usando componentes directamente para evitar zona horaria
        fecha = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
      }
    } 
    // Si la fecha viene en formato ISO (yyyy-mm-dd) o similar
    else if (fechaStr.includes("-")) {
      const partes = fechaStr.split("T")[0];
      const [año, mes, dia] = partes.split("-").map(num => parseInt(num));
      fecha = new Date(año, mes - 1, dia);
    }
    // Fallback: intentar parsear directamente
    else {
      fecha = new Date(fechaStr);
    }
    
    // Verificar si la fecha es válida
    if (isNaN(fecha)) return fechaStr;
    
    return `${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
  };

  const [selectedPub, setSelectedPub] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const { id } = useParams();
  const [publicacion, setPublicacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [categoriaCompleta, setCategoriaCompleta] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const obtenerPublicacion = async () => {
      try {
        setCargando(true);
        setError(null);

        const response = await fetch(`${API_URL}/publicaciones/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.mensaje || "No se encontró la publicación");
        }

        // Popular categoría si viene como id
        if (data.categoria && typeof data.categoria === "string") {
          const categoriaData = await getCategoriaById(data.categoria);
          if (categoriaData) {
            setCategoriaCompleta(categoriaData);
          }
        } else if (data.categoria && data.categoria.nombre) {
          setCategoriaCompleta(data.categoria);
        }

        setPublicacion(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setCargando(false);
      }
    };

    if (id) obtenerPublicacion();
  }, [id]);

  useEffect(() => {
    if (publicacion?.comentarios) {
      setComentarios(publicacion.comentarios);
    }
  }, [publicacion]);

  // === PRECIO (normalizado) ===
  const formatPrecio = (precio) => {
    if (precio === 0 || precio === '0') return 'Gratis';
    if (Number.isFinite(Number(precio))) {
      return `₡ ${Number(precio).toLocaleString("es-CR")}`;
    }
    return 'No especificado';
  };

  const precioRegular = publicacion?.precio;
  const precioEstudiante = publicacion?.precioEstudiante;
  const precioCiudadanoOro = publicacion?.precioCiudadanoOro;

  const mostrarPrecios = publicacion && 
    (publicacion.tag === "evento" || publicacion.tag === "emprendimiento");
  
  // === HORA DEL EVENTO (simple, ya viene "HH:mm") ===
  const mostrarHora =
    publicacion?.tag === "evento" &&
    typeof publicacion?.horaEvento === "string" &&
    publicacion.horaEvento.trim() !== "";

  // === TELÉFONO ===
  const telefono = publicacion?.telefono;

  // === ENLACES EXTERNOS ===
  const enlacesExternos = publicacion?.enlacesExternos || [];

  // Función para formatear correctamente los enlaces
  const formatearEnlace = (url) => {
    // Si es un correo sin mailto:, agregar el prefijo
    if (url.includes('@') && !url.startsWith('mailto:')) {
      return `mailto:${url}`;
    }
    // Si es un teléfono sin tel:, agregar el prefijo
    if (/^[\d\s\-\+\(\)]+$/.test(url.replace(/\s/g, '')) && !url.startsWith('tel:')) {
      return `tel:${url}`;
    }
    // Si no tiene protocolo y parece una URL, agregar https://
    if (!url.startsWith('http://') && !url.startsWith('https://') && 
        !url.startsWith('mailto:') && !url.startsWith('tel:') &&
        url.includes('.') && !url.includes(' ')) {
      return `https://${url}`;
    }
    return url;
  };

  // Función para determinar el ícono según el tipo de enlace
  const obtenerIconoEnlace = (url) => {
    if (url.includes('@') || url.startsWith('mailto:')) {
      return <IoMdMail className="mr-1" size={14} />;
    }
    if (url.includes('tel:') || /^[\d\s\-\+\(\)]+$/.test(url.replace(/\s/g, ''))) {
      return <IoMdCall className="mr-1" size={14} />;
    }
    if (url.includes('facebook.com')) {
      return <IoLogoFacebook className="mr-1" size={14} />;
    }
    if (url.includes('instagram.com')) {
      return <IoLogoInstagram className="mr-1" size={14} />;
    }
    if (url.includes('whatsapp.com') || url.includes('wa.me')) {
      return <IoLogoWhatsapp className="mr-1" size={14} />;
    }
    return <IoMdLink className="mr-1" size={14} />;
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center mt-10 bg-gray-800/80">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <h2 className="text-white-600">Cargando publicación...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex flex-col justify-center items-center h-96 bg-gray-900/80 text-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
          <p className="text-lg mb-4">{error}</p>
          <button
            onClick={() => (window.location.href = "/publicaciones")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          >
            Volver a publicaciones
          </button>
        </div>
      </div>
    );
  }

  if (!publicacion) return null;

  return (
    <div className="min-h-screen bg-gray-800/80">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Back (mobile) */}
        <div className="md:hidden flex justify-between w-full mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-md"
          >
            <IoMdArrowRoundBack color="black" size={21} />
          </button>
        </div>

        {publicacion && (
          <>
            {/* HEADER CON CLASIFICACIÓN Y BOTONES EN MISMA LÍNEA - CORREGIDO */}
            <div className="flex items-center justify-between mb-4">
              {/* Clasificación alineada a la izquierda */}
              <div className="flex items-center gap-2">
                <strong className="text-white text-sm md:text-base">Clasificación:</strong>
                <CategoriaBadge categoria={categoriaCompleta} mobile />
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex gap-2">
                {/* Botón Editar - para el autor (cualquier tipo de usuario) */}
                {user && user._id === publicacion.autor?._id && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="bg-blue-600 py-1.5 px-3 rounded hover:bg-blue-700 text-white text-sm md:py-2 md:px-4 md:text-base flex items-center gap-1"
                  >
                    <IoMdCreate size={16} />
                    Editar
                  </button>
                )}

                {/* Botón Eliminar - solo para administradores */}
                {user && (user.tipoUsuario === 0 || user.tipoUsuario === 1) && (
                  <button
                    className="bg-red-600 py-1.5 px-3 rounded hover:bg-red-700 text-white text-sm md:py-2 md:px-4 md:text-base"
                    onClick={() => setSelectedPub(true)}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>

            {/* TÍTULO CON SALTO DE LÍNEA AUTOMÁTICO */}
            <div className="flex items-center justify-center w-full mb-6">
              {/* Botón atrás (desktop) */}
              <div className="w-1/4 flex justify-start">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="hidden md:inline p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-md"
                >
                  <IoMdArrowRoundBack color="black" size={21} />
                </button>
              </div>

              {/* Título centrado con break-words */}
              <h1 className="w-2/4 text-xl font-bold text-white text-center break-words leading-tight md:text-3xl">
                {publicacion.titulo}
              </h1>

              {/* Espacio vacío para balancear el layout */}
              <div className="w-1/4"></div>
            </div>

            {/* MODALES - fuera del flujo condicional principal */}
            {showEditModal && (
              <EditarPublicacionModal
                publicacion={publicacion}
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onUpdate={() => {
                  // Recargar datos de la publicación
                  window.location.reload();
                }}
              />
            )}

            <PublicacionModal
              name={publicacion.titulo}
              date={publicacion.fecha}
              tag={publicacion.tag}
              id={publicacion._id}
              isOpen={selectedPub}
              onClose={() => setSelectedPub(false)}
            />

            {/* SLIDER CON MÁRGEN SUPERIOR */}
            <div className="mb-6">
              <Slider key={publicacion._id} publicacion={publicacion} />
            </div>

            {/* DETALLES PRINCIPALES CON MEJOR ESPACIADO */}
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
              <h2 className="text-white text-sm md:text-base mb-3">
                <IoMdPerson className="inline mr-2" />
                <strong>Autor:</strong>{" "}
                <span
                  className="text-blue-400 hover:text-blue-300 cursor-pointer hover:underline transition-colors"
                  onClick={() => navigate(`/perfil/${publicacion.autor?._id}`)}
                >
                  {publicacion.autor?.nombre || "Autor desconocido"}
                </span>
              </h2>

              {/* Descripción con SALTO DE LÍNEA AUTOMÁTICO */}
              <div className="mb-4">
                <p className="text-white text-sm md:text-base">
                  <strong>Descripción:</strong>
                </p>
                <p className="text-white mt-2 whitespace-pre-line break-words leading-relaxed">
                  {publicacion.contenido}
                </p>
              </div>

              {/* INFORMACIÓN ADICIONAL */}
              <div className="space-y-3">
                {/* PRECIOS */}
                {mostrarPrecios && (
                  <div className="bg-gray-600/30 rounded p-3">
                    <h3 className="text-white font-semibold mb-2">Precios:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center text-white">
                        <IoMdPerson className="mr-2 text-blue-400" />
                        <span className="font-medium">Precio regular:</span>
                        <span className="ml-2">{formatPrecio(precioRegular)}</span>
                      </div>
                      
                      {precioEstudiante !== undefined && precioEstudiante !== null && (
                        <div className="flex items-center text-white">
                          <IoMdSchool className="mr-2 text-green-400" />
                          <span className="font-medium">Estudiante:</span>
                          <span className="ml-2">{formatPrecio(precioEstudiante)}</span>
                        </div>
                      )}
                      
                      {precioCiudadanoOro !== undefined && precioCiudadanoOro !== null && (
                        <div className="flex items-center text-white">
                          <IoMdStar className="mr-2 text-yellow-400" />
                          <span className="font-medium">Ciudadano de oro:</span>
                          <span className="ml-2">{formatPrecio(precioCiudadanoOro)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fecha de evento */}
                {publicacion.fechaEvento && (
                  <div className="flex items-center text-white">
                    <strong className="mr-2">Fecha del evento:</strong>
                    {formatFecha(publicacion.fechaEvento)}
                  </div>
                )}

                {/* Hora de evento */}
                {mostrarHora && (
                  <div className="flex items-center text-white">
                    <strong className="mr-2">Hora del evento:</strong>
                    {publicacion.horaEvento}
                  </div>
                )}

                {/* Fecha de publicación */}
                {publicacion.fecha && (
                  <div className="flex items-center text-white">
                    <strong className="mr-2">Fecha de publicación:</strong>
                    {formatFecha(publicacion.fecha)}
                  </div>
                )}

                {/* TIPO */}
                <div className="flex items-center text-white">
                  <strong className="mr-2">Tipo:</strong>
                  {publicacion.tag || "Sin tag"}
                </div>

                {/* TELÉFONO */}
                {telefono && (
                  <div className="flex items-center text-white">
                    <IoMdCall className="mr-2 text-green-400" />
                    <strong className="mr-2">Teléfono:</strong>
                    <a 
                      href={`tel:${telefono}`}
                      className="text-blue-300 hover:text-blue-200 underline"
                    >
                      {telefono}
                    </a>
                  </div>
                )}

                {/* ENLACES EXTERNOS */}
                {enlacesExternos.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-2 flex items-center">
                      <IoMdLink className="mr-2 text-purple-400" />
                      Enlaces externos:
                    </h3>
                    <div className="space-y-2">
                      {enlacesExternos.map((enlace, index) => {
                        const enlaceFormateado = formatearEnlace(enlace.url);
                        const icono = obtenerIconoEnlace(enlace.url);
                        
                        return (
                          <div key={index} className="flex items-center">
                            <a
                              href={enlaceFormateado}
                              target={enlaceFormateado.startsWith('http') ? "_blank" : "_self"}
                              rel={enlaceFormateado.startsWith('http') ? "noopener noreferrer" : ""}
                              className="text-blue-300 hover:text-blue-200 underline flex items-center"
                            >
                              {icono}
                              {enlace.nombre}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* COMENTARIOS CON MÁRGEN SUPERIOR */}
            <div className="mt-6">
              <ComentariosPub
                comentarios={comentarios}
                setComentarios={setComentarios}
                publicacionId={publicacion._id}
                usuario={user}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicacionDetalle;