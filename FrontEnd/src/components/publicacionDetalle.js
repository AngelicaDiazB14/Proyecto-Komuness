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
            className="text-gray-600 text-2xl font-bold"
          >
            <IoMdArrowRoundBack color={"white"} size={35} />
          </button>
        </div>

        {publicacion && (
          <>
            {/* Clasificación */}
            <div className="flex items-center gap-2 mb-1">
              <strong className="text-white">Clasificación:</strong>
              <CategoriaBadge categoria={categoriaCompleta} />
            </div>

            {/* Título centrado */}
            <div className="flex items-center justify-between w-full mb-2">
              {/* Botón atrás (desktop) */}
              <div className="w-1/3 flex justify-start">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="hidden md:inline px-1 py-1 bg-white rounded-full"
                >
                  <IoMdArrowRoundBack color={"black"} size={25} />
                </button>
              </div>

              <h1 className="w-1/3 text-3xl font-bold text-white text-center mt-2">
                {publicacion.titulo}
              </h1>

              {/* Botón Eliminar (derecha) */}

              <div className="w-1/3 flex justify-end">
                {user && (user.tipoUsuario === 0 || user.tipoUsuario === 1) && (
                  <div>
                    <button
                      className="bg-red-600 py-2 px-4 rounded hover:bg-red-600"
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
            </div>

            {/* Detalles principales */}
            <h2 className="text-white">
              <strong>Autor:</strong>{" "}
              {publicacion.autor?.nombre || "Autor desconocido"}
            </h2>

            <Slider key={publicacion._id} publicacion={publicacion} />

            <div className="text-white-600">
              {/* Descripción y campos generales */}
              <p className="mt-2 text-white">
                <strong>Descripción:</strong>{" "}
                <span className="whitespace-pre-line">
                  {publicacion.contenido}
                </span>
              </p>

              {/* Precio (normalizado y condicionado) */}
              {mostrarPrecio && (
                <p className="text-white">
                  <strong>Precio:</strong>{" "}
                  {`₡ ${precio.toLocaleString("es-CR")}`}
                </p>
              )}

              {/* Fecha de evento (si existe un campo específico) */}
              {publicacion.fechaEvento && (
                <p className="text-white">
                  <strong>Fecha del evento:</strong>{" "}
                  {formatFecha(publicacion.fechaEvento)}
                </p>
              )}

              {/* Hora de evento (si aplica) */}
              {mostrarHora && (
                <p className="text-white">
                  <strong>Hora del evento:</strong> {publicacion.horaEvento}
                </p>
              )}

              {/* Fecha de publicación (siempre que exista) */}
              {publicacion.fecha && (
                <p className="text-white">
                  <strong>Fecha de publicación:</strong>{" "}
                  {formatFecha(publicacion.fecha)}
                </p>
              )}

              {/* Categoría y Tag */}
              <p className="text-white">
                <strong>Categoría:</strong>{" "}
                {publicacion.categoria?.nombre ||
                  categoriaCompleta?.nombre ||
                  "Sin categoría"}
              </p>
              <p className="text-white">
                <strong>Tag:</strong> {publicacion.tag || "Sin tag"}
              </p>
            </div>

            {/* COMENTARIOS */}
            <ComentariosPub
              comentarios={comentarios}
              setComentarios={setComentarios}
              publicacionId={publicacion._id}
              usuario={user}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PublicacionDetalle;
