import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PublicacionModal from "./publicacionModal";
import { useAuth } from "./context/AuthContext";
import CategoriaBadge from "./categoriaBadge";
import ProfileErrorModal from "./ProfileErrorModal"; 
import { API_URL, BASE_URL } from '../utils/api';

export const PublicacionCard = ({ publicacion }) => {
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
      const partes = fechaStr.split("T")[0]; // CAMBIO: Quitar la parte de hora si existe
      const [año, mes, dia] = partes.split("-").map(num => parseInt(num));
      // CAMBIO: Crear fecha usando componentes directamente para evitar problemas de zona horaria
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
  // ========== FIN DE MODIFICACIÓN ==========

  const navigate = useNavigate();
  const [selectedPub, setSelectedPub] = useState(false);
  const { user } = useAuth();
  
  // Estados para controlar el modal de error de perfil
  const [showProfileError, setShowProfileError] = useState(false);
  const [errorType, setErrorType] = useState('private');

  const formatPrecioCard = (precio) => {
    if (precio === 0 || precio === '0') return 'Gratis';
    if (Number.isFinite(Number(precio))) {
      return `₡ ${Number(precio).toLocaleString("es-CR")}`;
    }
    return 'No especificado';
  };

  const handleClick = () => {
    navigate(`/publicaciones/${publicacion._id}`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Evita que se active el navigate
    setSelectedPub(true);
  };

  // ========== FUNCIÓN PARA MANEJAR CLIC EN PERFIL ==========
  // MODIFICACIÓN: Se agregó función para verificar si el perfil es público
  const handleProfileClick = async (e, userId) => {
    e.stopPropagation(); // Evita que se active el navigate de la card
    
    if (!userId) return; // Si no hay ID, no hacer nada
    
    try {
      // Verificar si el perfil es público antes de navegar
      const response = await fetch(`${API_URL}/perfil/${userId}?modo=basico`);
      
      if (!response.ok) {
        if (response.status === 403) {
          // Perfil no es público - mostrar modal de error
          setErrorType('private');
          setShowProfileError(true);
          return;
        } else if (response.status === 404) {
          // Perfil no encontrado - mostrar modal de error
          setErrorType('notFound');
          setShowProfileError(true);
          return;
        }
        throw new Error('Error al cargar el perfil');
      }
      
      // Si el perfil es público, navegar normalmente
      navigate(`/perfil/${userId}`);
      
    } catch (error) {
      console.error('Error al verificar perfil:', error);
      setErrorType('private');
      setShowProfileError(true);
    }
  };
  // ========== FIN DE MODIFICACIÓN ==========

  const tieneImagenes = publicacion.adjunto && publicacion.adjunto.length > 0;
  const esPublicacion = publicacion.tag === "publicacion";

  // Obtener la inicial del autor
  const getInicialAutor = () => {
    if (publicacion.autor?.nombre) {
      return publicacion.autor.nombre.charAt(0).toUpperCase();
    }
    return "X"; //  de Usuario si no hay nombre
  };

  // Color basado en la inicial para consistencia
  const getColorFromInitial = (initial) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
    ];
    const charCode = initial.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  const colorAutor = getColorFromInitial(getInicialAutor());

  // === PRECIO (normalizado) ===
  const rawPrecio = publicacion?.precio ?? publicacion?.Precio;
  const precio = Number(rawPrecio);
  const mostrarPrecio =
    (publicacion.tag === "evento" || publicacion.tag === "emprendimiento") &&
    Number.isFinite(precio);

  return (
    <>
      {/* ========== MODAL DE ERROR DE PERFIL ========== */}
      {/* MODIFICACIÓN: El modal se renderiza fuera de la card, directamente en el body */}
      <ProfileErrorModal
        isOpen={showProfileError}
        onClose={() => setShowProfileError(false)}
        type={errorType}
      />
      <div className="card bg-white rounded-lg overflow-hidden shadow-lg flex flex-col h-full">
        <div className="relative flex-grow" onClick={handleClick}>
          {/* Badge de categoría - MÁS PEQUEÑO EN MÓVIL */}
          <div className="absolute top-2 right-2 z-10">
            <CategoriaBadge categoria={publicacion.categoria} mobile />
          </div>

          {/* Chip de precio - MÁS PEQUEÑO EN MÓVIL */}
          {mostrarPrecio && (
            <div className="absolute top-2 left-2 z-10">
              <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold shadow md:px-2 md:py-1 md:text-xs">
                {formatPrecioCard(precio)}
              </span>
            </div>
          )}

          {/* Espacio de imagen para publicaciones NO 'publicacion' */}
          {!esPublicacion && (
            <div className="imagen h-48 bg-gray-200 flex items-center justify-center">
              {tieneImagenes ? (
                <img
                  src={publicacion.adjunto[0]?.url}
                  alt={publicacion.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-500 text-center p-4">
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-sm">No hay imagen</p>
                </div>
              )}
            </div>
          )}

          {/* Espacio de imagen para publicaciones de tipo 'publicacion' */}
          {esPublicacion && (
            <div className="imagen h-48 bg-blue-900 flex items-center justify-center">
              {tieneImagenes ? (
                <img
                  src={publicacion.adjunto[0]?.url}
                  alt={publicacion.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-20 h-20 ${colorAutor} rounded-full flex items-center justify-center text-white text-4xl font-bold cursor-pointer hover:opacity-80 transition-opacity`}
                  onClick={(e) => handleProfileClick(e, publicacion.autor?._id)}
                >
                  {getInicialAutor()}
                </div>
              )}
            </div>
          )}

          {/* Detalles */}
          <div className="p-4">
            {/* Emprendimiento */}
            {publicacion.tag === "emprendimiento" && (
              <div className="card-details">
                <h3 className="titulo">{publicacion.titulo}</h3>
                <p className="fecha">
                  Creador por:{" "}
                  <span
                    className="text-white hover:text-blue-100 cursor-pointer hover:underline"
                    onClick={(e) => handleProfileClick(e, publicacion.autor?._id)}
                  >
                    {publicacion.autor?.nombre || "Desconocido"}
                  </span>
                </p>
                <p className="fecha">Fecha: {formatFecha(publicacion.fecha)}</p>
              </div>
            )}

              {/* Otros (p.ej. evento) */}
              {publicacion.tag !== "publicacion" &&
                  publicacion.tag !== "emprendimiento" && (
                  <div className="card-details">
                      <h3 className="titulo">{publicacion.titulo}</h3>
                      <p className="fecha">
                      Publicado por:{" "}
                      <span
                        className="text-white hover:text-blue-100 cursor-pointer hover:underline"
                        onClick={(e) => handleProfileClick(e, publicacion.autor?._id)}
                      >
                        {publicacion.autor?.nombre || "Desconocido"}
                      </span>
                      </p>
                      <p className="fecha">
                      Fecha del evento:{" "}
                      {formatFecha(publicacion.fechaEvento || publicacion.fecha)}
                      </p>
                  </div>
                  )}

              {/* Publicación estilo tweet */}
              {publicacion.tag === "publicacion" && (
                  <div className="tweet">
                  <div className="tweet-header mb-2">
                      <div className="tweet-user">
                      <h4
                        className="user-name font-semibold text-white hover:text-blue-100 cursor-pointer hover:underline"
                        onClick={(e) => handleProfileClick(e, publicacion.autor?._id)}
                      >
                          {publicacion.autor?.nombre || "Desconocido"}
                      </h4>
                      </div>
                  </div>
                  <div className="tweet-content mb-2">
                      <p className="text-gray-700">{publicacion.titulo}</p>
                  </div>
                  <div className="tweet-footer mt-2">
                      <p className="tweet-date text-sm text-gray-600">
                      Publicado el {formatFecha(publicacion.fecha)}
                      </p>
              </div>      
                  </div>
              )}
              </div>
          </div>

        {/* Botón de eliminar (solo para admins) - MÁS PEQUEÑO EN MÓVIL */}
        {user && (user.tipoUsuario === 0 || user.tipoUsuario === 1) && (
          <div className="p-3 border-t md:p-4"> {/* Padding reducido en móvil */}
            <button
              className="w-full bg-red-600 text-white py-1.5 px-3 rounded hover:bg-red-700 transition-colors text-sm md:py-2 md:px-4 md:text-base" /* Tamaño reducido en móvil */
              onClick={handleDeleteClick}
            >
              Eliminar
            </button>
              <PublicacionModal
            name={publicacion.titulo}
            date={publicacion.fecha}
            tag={publicacion.tag}
            id={publicacion._id}
            isOpen={selectedPub}
            onClose={() => setSelectedPub(false)}
            onDelete={() => {
              setSelectedPub(false);
              // Aquí puedes agregar lógica adicional si necesitas
            }}
          />
          </div>
        )}
      </div>
    </>
  );
};

export default PublicacionCard;
