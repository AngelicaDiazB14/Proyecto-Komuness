import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineUser } from "react-icons/ai";
import { toast } from "react-hot-toast";
import { API_URL } from "../utils/api";
import "../CSS/perfilUsuario.css";
import { useAuth } from "./context/AuthContext";
import ModalCambioContrasena from "./modalCambioContra";
import { Link } from "react-router-dom"; 
import { FaListAlt, FaEdit, FaHistory } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import ModalLimitesPublicaciones from "./modalLimitesPublicaciones";

export const PerfilUsuario = () => {
  const navigate = useNavigate();
  const [publicaciones, setPublicaciones] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [pendingUpdates, setPendingUpdates] = useState([]); // NUEVO: Actualizaciones pendientes
  const { user, logout } = useAuth();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalLimitesAbierto, setModalLimitesAbierto] = useState(false);
  const [activeTab, setActiveTab] = useState('publicaciones'); // NUEVO: Control de pestañas

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Función para cargar publicaciones pendientes
  const cargarPublicaciones = async () => {
    try {
      const responseapi = await fetch(`${API_URL}/publicaciones/?publicado=false`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!responseapi.ok) {
        if (responseapi.status === 401 || responseapi.status === 403) {
          logout();
          navigate("/iniciarSesion");
        }
      }
      const data = await responseapi.json();
      setPublicaciones(data.data);
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  // Función para cargar actualizaciones pendientes
  const cargarActualizacionesPendientes = async () => {
    try {
      console.log('Cargando actualizaciones pendientes...');
      
      const response = await fetch(`${API_URL}/publicaciones/admin/pending-updates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log('Response status:', response.status);
      
      if (response.status === 404) {
        // Si no hay actualizaciones pendientes, establecer array vacío
        setPendingUpdates([]);
        return;
      }
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          navigate("/iniciarSesion");
          return;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Datos recibidos:', data);
      
      setPendingUpdates(data.data || []);
    } catch (error) {
      console.error("Error al cargar actualizaciones pendientes:", error);
      
      // Si es un error 404, no mostrar toast de error
      if (error.message.includes('404')) {
        setPendingUpdates([]);
      } else {
        toast.error('Error al cargar actualizaciones pendientes');
      }
    }
  };

  // Función para cargar archivos
  const cargarArchivos = () => {
    fetch(`${API_URL}/biblioteca/list/0?publico=false&global=true`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setArchivos(data.contentFile))
      .catch((error) => console.error("Error al obtener los archivos: ", error));
  };

  // Función para cargar usuarios
  const cargarUsuarios = async () => {
    try {
      const apires = await fetch(`${API_URL}/usuario?tipoUsuario=1,2`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!apires.ok) {
        if (apires.status === 401 || apires.status === 403) {
          logout();
          navigate("/iniciarSesion");
        }
      }
      const data = await apires.json();
      setUsuarios(data);
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  // useEffect que controla la carga de datos administrativos
  useEffect(() => {
    const loader = async () => {
      if (user && (user.tipoUsuario === 0 || user.tipoUsuario === 1)) {
        await cargarPublicaciones();
        await cargarArchivos();
        await cargarUsuarios();
        await cargarActualizacionesPendientes(); // NUEVO: Cargar actualizaciones pendientes
      }
    };
    loader();
  }, [user]);

  // Función para recargar datos cuando se cambia de pestaña
  useEffect(() => {
    if (user && (user.tipoUsuario === 0 || user.tipoUsuario === 1)) {
      if (activeTab === 'publicaciones') {
        cargarPublicaciones();
      } else if (activeTab === 'actualizaciones') {
        cargarActualizacionesPendientes();
      }
    }
  }, [activeTab, user]);

  const aceptarPost = async (id) => {
    const promesa = fetch(`${API_URL}/publicaciones/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ publicado: true }),
    });

    toast.promise(promesa, {
      loading: "Aceptando publicación...",
      success: "¡Publicación aceptada!",
      error: "Error al aceptar publicación",
    });

    try {
      await promesa;
      setPublicaciones((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error al aceptar publicación:", error);
    }
  };

  const rechazarPost = async (id) => {
    const promesa = fetch(`${API_URL}/publicaciones/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    toast.promise(promesa, {
      loading: "Eliminando publicación...",
      success: "¡Publicación eliminada!",
      error: "Error al eliminar publicación",
    });

    try {
      await promesa;
      setPublicaciones((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error al eliminar publicación:", error);
    }
  };

  //  Funciones para manejar actualizaciones pendientes
  
  const aprobarActualizacion = async (publicacionId) => {
  try {
    console.log('🔄 Aprobando actualización para:', publicacionId);
    
    const response = await fetch(`${API_URL}/publicaciones/admin/${publicacionId}/approve-update`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status);
    
    const data = await response.json();
    console.log('📡 Response data:', data);

    if (response.ok) {
      toast.success('Actualización aprobada exitosamente');
      console.log(' Actualización aprobada, recargando lista...');
      setPendingUpdates(prev => prev.filter(item => item._id !== publicacionId));
      
      // Forzar recarga de datos después de un breve delay
      setTimeout(() => {
        cargarActualizacionesPendientes();
      }, 500);
    } else {
      console.error(' Error del servidor:', data);
      
      if (response.status === 400) {
        throw new Error(data.message || 'Datos inválidos');
      } else if (response.status === 404) {
        throw new Error('Publicación no encontrada');
      } else if (response.status === 500) {
        throw new Error('Error interno del servidor. Contacte al administrador.');
      } else {
        throw new Error(data.message || `Error ${response.status} al aprobar actualización`);
      }
    }
  } catch (error) {
    console.error(' Error al aprobar actualización:', error);
    
    if (error.message.includes('Contacte al administrador')) {
      toast.error('Error del servidor. Por favor, contacte al administrador.');
    } else {
      toast.error(error.message);
    }
  }
};
  const rechazarActualizacion = async (publicacionId, reason = '') => {
    try {
      const response = await fetch(`${API_URL}/publicaciones/admin/${publicacionId}/reject-update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Actualización rechazada');
        setPendingUpdates(prev => prev.filter(item => item._id !== publicacionId));
      } else {
        throw new Error(data.message || 'Error al rechazar actualización');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  function formatearTamano(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  const aceptarArchivo = async (id) => {
    const promesa = fetch(`${API_URL}/biblioteca/edit/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ esPublico: true }),
    });

    toast.promise(promesa, {
      loading: "Aceptando archivo...",
      success: "¡Archivo aceptado!",
      error: "Error al aceptar el archivo",
    });

    try {
      await promesa;
      setArchivos((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error al aceptar el archivo:", error);
    }
  };

  const rechazarArchivo = async (id) => {
    const promesa = fetch(`${API_URL}/biblioteca/delete/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    toast.promise(promesa, {
      loading: "Eliminando archivo...",
      success: "¡Archivo eliminado!",
      error: "Error al eliminar el archivo",
    });

    try {
      await promesa;
      setArchivos((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error al eliminar archivo:", error);
    }
  };

  const otorgarPermiso = async (id, tipoUsuarioActual) => {
    const nuevoTipoUsuario = tipoUsuarioActual === 1 ? 2 : 1;

    const promesa = fetch(`${API_URL}/usuario/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ tipoUsuario: nuevoTipoUsuario }),
    });

    toast.promise(promesa, {
      loading: "Actualizando permisos...",
      success: "Permisos actualizados",
      error: "Error al actualizar permisos",
    });

    try {
      const response = await promesa;
      const usuarioActualizado = await response.json();

      setUsuarios((prevUsuarios) =>
        prevUsuarios.map((usuario) =>
          usuario._id === id ? usuarioActualizado : usuario
        )
      );
    } catch (error) {
      console.error("Error al actualizar permisos:", error);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");

  const usuariosFiltrados = usuarios.filter((item) => {
    const texto = searchTerm.toLowerCase();
    return (
      item.nombre?.toLowerCase().includes(texto) ||
      item.apellido?.toLowerCase().includes(texto) ||
      item.email.toLowerCase().includes(texto)
    );
  });


  // Función para mostrar cambios propuestos
  const renderCambiosPropuestos = (publicacion) => {
    if (!publicacion.pendingUpdate) return null;

    const cambios = [];
    const update = publicacion.pendingUpdate;

    if (update.titulo && update.titulo !== publicacion.titulo) {
      cambios.push(
        <div key="titulo" className="mb-2">
          <strong className="text-gray-800">Título:</strong> 
          <span className="line-through text-red-600 ml-2 mr-2">{publicacion.titulo}</span>
          <span className="text-green-600">→ {update.titulo}</span>
        </div>
      );
    }

    if (update.contenido && update.contenido !== publicacion.contenido) {
      cambios.push(
        <div key="contenido" className="mb-2">
          <strong className="text-gray-800">Descripción:</strong>
          <div className="text-sm mt-1">
            <div className="text-red-600 line-through mb-1">
              {publicacion.contenido.substring(0, 100)}...
            </div>
            <div className="text-green-600">
              {update.contenido.substring(0, 100)}...
            </div>
          </div>
        </div>
      );
    }

    if (update.precio !== undefined && update.precio !== publicacion.precio) {
      cambios.push(
        <div key="precio" className="mb-2">
          <strong className="text-gray-800">Precio:</strong> 
          <span className="line-through text-red-600 ml-2 mr-2">
            {publicacion.precio || 'No especificado'}
          </span>
          <span className="text-green-600">→ {update.precio}</span>
        </div>
      );
    }

    if (update.fechaEvento && update.fechaEvento !== publicacion.fechaEvento) {
      cambios.push(
        <div key="fechaEvento" className="mb-2">
          <strong className="text-gray-800">Fecha Evento:</strong> 
          <span className="line-through text-red-600 ml-2 mr-2">
            {publicacion.fechaEvento || 'No especificado'}
          </span>
          <span className="text-green-600">→ {update.fechaEvento}</span>
        </div>
      );
    }

    if (update.horaEvento && update.horaEvento !== publicacion.horaEvento) {
      cambios.push(
        <div key="horaEvento" className="mb-2">
          <strong className="text-gray-800">Hora Evento:</strong> 
          <span className="line-through text-red-600 ml-2 mr-2">
            {publicacion.horaEvento || 'No especificado'}
          </span>
          <span className="text-green-600">→ {update.horaEvento}</span>
        </div>
      );
    }

    if (update.telefono && update.telefono !== publicacion.telefono) {
      cambios.push(
        <div key="telefono" className="mb-2">
          <strong className="text-gray-800">Teléfono:</strong> 
          <span className="line-through text-red-600 ml-2 mr-2">
            {publicacion.telefono || 'No especificado'}
          </span>
          <span className="text-green-600">→ {update.telefono}</span>
        </div>
      );
    }

    return cambios;
  };

  return (
    <div className={`flex flex-col md:flex-row gap-6 w-full min-h-screen bg-gray-800/80 p-6
      ${user?.tipoUsuario === 2 ? "justify-center" : "md:flex-row gap-6"}`}>
      
      {/* Sección de perfil del usuario (sin cambios) */}
      <div className={`paginaUsuario flex flex-col items-center gap-4 w-full 
          ${user?.tipoUsuario === 2 ? "items-center w-full max-w-md" : "items-center w-full md:w-1/3"}`}>
        <AiOutlineUser size={150} className="text-white" />
        <div className="text-white text-center md:text-left">
          <div>
            <span className="text-xl font-semibold">
              {user?.nombre} {user?.apellido}
            </span>
          </div>
          <div>
            <a href={`mailto:${user?.email}`} className="text-blue-400 hover:underline">
              {user?.email}
            </a>
          </div>
          <div>
            {modalAbierto && (
              <ModalCambioContrasena
                userId={user._id}
                onClose={() => setModalAbierto(false)}
                API_URL={API_URL}
              />
            )}
            <button
              onClick={() => setModalAbierto(true)}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Cambiar contraseña
            </button>
          </div>
          <div>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {user && (user.tipoUsuario === 0 || user.tipoUsuario === 1) && (
        <div className="w-full md:w-2/3 flex flex-col gap-6 bg-gray-50 rounded-xl p-6">
          <h1 className="text-2xl font-bold text-black mb-4">Dashboard Administrativo</h1>
          
          {/* Botones de configuración */}
          {user.tipoUsuario === 0 || user.tipoUsuario === 1 && (
            <div className="mb-6 flex gap-4 flex-wrap">
              <Link 
                to="/admin/categorias" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                <FaListAlt className="w-4 h-4 mr-2" />
                Gestionar Categorías
              </Link>
              
              <button
                onClick={() => setModalLimitesAbierto(true)}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium"
              >
                <FiSettings className="w-4 h-4 mr-2" />
                Configurar Límites de Publicaciones
              </button>
            </div>
          )}

          <ModalLimitesPublicaciones 
            isOpen={modalLimitesAbierto} 
            onClose={() => setModalLimitesAbierto(false)} 
          />

          {/* Pestañas para navegación */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('publicaciones')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'publicaciones'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaListAlt className="inline w-4 h-4 mr-2" />
                Publicaciones Nuevas ({publicaciones.length})
              </button>
              
              <button
                onClick={() => setActiveTab('actualizaciones')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'actualizaciones'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaEdit className="inline w-4 h-4 mr-2" />
                Actualizaciones Pendientes ({pendingUpdates.length})
              </button>

              <button
                onClick={() => setActiveTab('archivos')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'archivos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaHistory className="inline w-4 h-4 mr-2" />
                Archivos Nuevos ({archivos.length})
              </button>

              <button
                onClick={() => setActiveTab('usuarios')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'usuarios'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AiOutlineUser className="inline w-4 h-4 mr-2" />
                Gestión de Usuarios
              </button>
            </nav>
          </div>

          {/* Contenido de las pestañas */}
          <div className="flex-1">
            {/* Pestaña: Publicaciones Nuevas */}
            {activeTab === 'publicaciones' && (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto bg-white rounded-xl shadow-md p-4">
                <h2 className="text-lg font-semibold text-black mb-4">
                  Publicaciones nuevas por aprobar
                </h2>
                {publicaciones && publicaciones.length > 0 ? (
                  <table className="min-w-full text-black text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left px-4 py-2">Autor</th>
                        <th className="text-left px-4 py-2">Título</th>
                        <th className="text-left px-4 py-2">Tipo</th>
                        <th className="text-left px-4 py-2">Fecha</th>
                        <th className="text-left px-4 py-2">Vista Previa</th>
                        <th className="text-left px-4 py-2">Decisión</th>
                      </tr>
                    </thead>
                    <tbody>
                      {publicaciones.map((item) => (
                        <tr key={item._id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2">
                            {item.autor ? item.autor.nombre : "Sin autor"}
                          </td>
                          <td className="px-4 py-2">{item.titulo}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.tag === 'evento' ? 'bg-blue-100 text-blue-800' :
                              item.tag === 'emprendimiento' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.tag}
                            </span>
                          </td>
                          <td className="px-4 py-2">{item.fecha}</td>
                          <td className="px-4 py-2">
                            <a
                              href={`/publicaciones/${item._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              Ver publicación
                            </a>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => aceptarPost(item._id)}
                                className="bg-green-500 hover:bg-green-600 text-white font-medium px-3 py-1 rounded text-sm"
                              >
                                Aceptar
                              </button>
                              <button
                                onClick={() => rechazarPost(item._id)}
                                className="bg-red-500 hover:bg-red-600 text-white font-medium px-3 py-1 rounded text-sm"
                              >
                                Rechazar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay publicaciones pendientes de aprobación.
                  </div>
                )}
              </div>
            )}

            {/*  Actualizaciones Pendientes */}
            {activeTab === 'actualizaciones' && (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto bg-white rounded-xl shadow-md p-4">
                <h2 className="text-lg font-semibold text-black mb-4">
                  Actualizaciones pendientes de revisión
                </h2>
                {pendingUpdates && pendingUpdates.length > 0 ? (
                  <div className="space-y-4">
                    {pendingUpdates.map((publicacion) => (
                      <div key={publicacion._id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg text-black">{publicacion.titulo}</h3>
                              <span className={`px-2 py-1 rounded text-xs ${
                                publicacion.tag === 'evento' ? 'bg-blue-100 text-blue-800' :
                                publicacion.tag === 'emprendimiento' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {publicacion.tag}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              <strong>Autor:</strong> {publicacion.autor?.nombre} • 
                              <strong> Solicitado:</strong> {new Date(publicacion.lastEditRequest).toLocaleDateString()} • 
                              <strong> Ediciones realizadas:</strong> {publicacion.editCount || 0}/3
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => aprobarActualizacion(publicacion._id)}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Razón del rechazo (opcional):');
                                rechazarActualizacion(publicacion._id, reason);
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              Rechazar
                            </button>
                          </div>
                        </div>

                        {/* Mostrar cambios propuestos */}
                        <div className="mt-3 p-3 bg-gray-50 rounded border">
                          <h4 className="font-medium text-black mb-2">Cambios propuestos:</h4>
                          {renderCambiosPropuestos(publicacion)}
                          
                          {publicacion.pendingUpdate && Object.keys(publicacion.pendingUpdate).length === 2 && (
                            <p className="text-gray-500 text-sm">No se detectaron cambios visibles en los campos principales.</p>
                          )}
                        </div>

                        <div className="mt-2 flex gap-2">
                          <a
                            href={`/publicaciones/${publicacion._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline text-sm"
                          >
                            Ver publicación actual
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay actualizaciones pendientes de revisión.
                  </div>
                )}
              </div>
            )}

            {/* Pestaña: Archivos Nuevos */}
            {activeTab === 'archivos' && (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto bg-white rounded-xl shadow-md p-4">
                <h2 className="text-lg font-semibold text-black mb-4">
                  Archivos nuevos por aprobar
                </h2>
                {archivos && archivos.length > 0 ? (
                  <table className="min-w-full text-black text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left px-4 py-2">Autor</th>
                        <th className="text-left px-4 py-2">Título</th>
                        <th className="text-left px-4 py-2">Tamaño</th>
                        <th className="text-left px-4 py-2">Fecha</th>
                        <th className="text-left px-4 py-2">Decisión</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archivos.map((item) => (
                        <tr key={item._id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2">
                            {item.autor ? item.autor.nombre : "Sin autor"}
                          </td>
                          <td className="px-4 py-2">{item.nombre}</td>
                          <td className="px-4 py-2">
                            {formatearTamano(item.tamano)}
                          </td>
                          <td className="px-4 py-2">
                            {item.fechaSubida
                              ? new Date(item.fechaSubida).toLocaleDateString("es-ES")
                              : "Fecha no disponible"}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => aceptarArchivo(item._id)}
                                className="bg-green-500 hover:bg-green-600 text-white font-medium px-3 py-1 rounded text-sm"
                              >
                                Aceptar
                              </button>
                              <button
                                onClick={() => rechazarArchivo(item._id)}
                                className="bg-red-500 hover:bg-red-600 text-white font-medium px-3 py-1 rounded text-sm"
                              >
                                Rechazar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay archivos pendientes de aprobación.
                  </div>
                )}
              </div>
            )}

            {/* Pestaña: Gestión de Usuarios */}
            {activeTab === 'usuarios' && (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto bg-white rounded-xl shadow-md p-4">
                <h2 className="text-lg font-semibold text-black mb-4">Gestión de permisos de usuarios</h2>

                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-4 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                />

                {usuariosFiltrados && usuariosFiltrados.length > 0 ? (
                  <table className="min-w-full text-black text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left px-4 py-2">Nombre</th>
                        <th className="text-left px-4 py-2">Apellidos</th>
                        <th className="text-left px-4 py-2">Email</th>
                        <th className="text-left px-4 py-2">Tipo de Usuario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosFiltrados.map((item) => (
                        <tr key={item._id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2">{item.nombre || "Sin nombre"}</td>
                          <td className="px-4 py-2">{item.apellido || "Sin apellido"}</td>
                          <td className="px-4 py-2">{item.email}</td>
                          <td className="px-4 py-2">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="absolute w-0 h-0 opacity-0 sr-only peer"
                                checked={item.tipoUsuario === 1}
                                onChange={() => otorgarPermiso(item._id, item.tipoUsuario)}
                              />
                              <div
                                className="relative w-14 h-7 bg-gray-200 rounded-full peer dark:bg-gray-700
                                peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800
                                peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full
                                peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5
                                after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full
                                after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-400 dark:peer-checked:bg-yellow-400"
                              ></div>
                              <span className="ms-3 text-sm font-medium text-black-900 dark:text-black-300">
                                {item.tipoUsuario === 1 ? "Admin" : "Usuario"}
                              </span>
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron usuarios.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerfilUsuario;