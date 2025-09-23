import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { API_URL, getCategoriaById } from "../utils/api";

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

  const [selectedPub, setSelectedPub] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const { id } = useParams();
  const [publicacion, setPublicacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [categoriaCompleta, setCategoriaCompleta] = useState(null);

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
  const rawPrecio = publicacion?.precio ?? publicacion?.Precio;
  const precio = Number(rawPrecio);
  const mostrarPrecio =
    publicacion &&
    (publicacion.tag === "evento" || publicacion.tag === "emprendimiento") &&
    Number.isFinite(precio);

  // === HORA DEL EVENTO (simple, ya viene "HH:mm") ===
  const mostrarHora =
    publicacion?.tag === "evento" &&
    typeof publicacion?.horaEvento === "string" &&
    publicacion.horaEvento.trim() !== "";

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
            {/* HEADER CON CLASIFICACIÓN Y BOTÓN ELIMINAR EN MISMA LÍNEA */}
            <div className="flex items-center justify-between mb-4">
              {/* Clasificación alineada a la izquierda */}
              <div className="flex items-center gap-2">
                <strong className="text-white text-sm md:text-base">Clasificación:</strong>
                <CategoriaBadge categoria={categoriaCompleta} mobile />
              </div>

              {/* Botón Eliminar alineado a la derecha */}
              {user && (user.tipoUsuario === 0 || user.tipoUsuario === 1) && (
                <div>
                  <button
                    className="bg-red-600 py-1.5 px-3 rounded hover:bg-red-700 text-sm md:py-2 md:px-4 md:text-base"
                    onClick={() => setSelectedPub(true)}
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
                  />
                </div>
              )}
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

            {/* SLIDER CON MÁRGEN SUPERIOR */}
            <div className="mb-6">
              <Slider key={publicacion._id} publicacion={publicacion} />
            </div>

            {/* DETALLES PRINCIPALES CON MEJOR ESPACIADO */}
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
              <h2 className="text-white text-sm md:text-base mb-3">
                <strong>Autor:</strong>{" "}
                {publicacion.autor?.nombre || "Autor desconocido"}
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

              {/* INFORMACIÓN ADICIONAL EN GRID RESPONSIVE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Precio */}
                {mostrarPrecio && (
                  <p className="text-white text-sm md:text-base">
                    <strong>Precio:</strong>{" "}
                    {`₡ ${precio.toLocaleString("es-CR")}`}
                  </p>
                )}

                {/* Fecha de evento */}
                {publicacion.fechaEvento && (
                  <p className="text-white text-sm md:text-base">
                    <strong>Fecha del evento:</strong>{" "}
                    {formatFecha(publicacion.fechaEvento)}
                  </p>
                )}

                {/* Hora de evento */}
                {mostrarHora && (
                  <p className="text-white text-sm md:text-base">
                    <strong>Hora del evento:</strong> {publicacion.horaEvento}
                  </p>
                )}

                {/* Fecha de publicación */}
                {publicacion.fecha && (
                  <p className="text-white text-sm md:text-base">
                    <strong>Fecha de publicación:</strong>{" "}
                    {formatFecha(publicacion.fecha)}
                  </p>
                )}

                {/* Tipo */}
                <p className="text-white text-sm md:text-base">
                  <strong>Tipo:</strong> {publicacion.tag || "Sin tag"}
                </p>
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