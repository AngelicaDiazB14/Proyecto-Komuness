import React, { useState, useCallback, useEffect } from 'react'
import DocumentCard from './documentCard'
import DocumentModal from './documentModal'

import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  AiFillFilePdf,
  AiFillFileExcel,
  AiFillFileWord,
  AiFillFilePpt,
  AiFillFileText,
  AiFillFileImage,
  AiFillFileZip,
  AiFillFile,
  AiFillFolder,
} from 'react-icons/ai'
import { useDropzone } from 'react-dropzone'
import { toast } from "react-hot-toast";
import { useAuth } from "../components/context/AuthContext";
import { API_URL } from '../utils/api';

export const Biblioteca = () => {

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [folderName, setFolderName] = useState(location.state?.folderName || 'Biblioteca');
  const [selectedDoc, setSelectedDoc] = useState(null);

  const handleOpenModal = (doc) => setSelectedDoc(doc);
  const handleCloseModal = () => setSelectedDoc(null);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = selectedDoc.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleCloseModal();
  };

  const handleDelete = async () => {
    try {
      if (selectedDoc.tag === 'carpeta') {
        await toast.promise(
          fetch(`${API_URL}/biblioteca/folder/${selectedDoc.id}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
          }).then((res) => {
            if (!res.ok) throw new Error("No se pudo eliminar la carpeta");
            return res.json();
          }),
          {
            loading: "Eliminando carpeta...",
            success: "¡Carpeta eliminada!",
            error: "Error al eliminar la carpeta",
          }
        );
      } else {
        await toast.promise(
          fetch(`${API_URL}/biblioteca/delete/${selectedDoc.id}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
          }).then((res) => {
            if (!res.ok) throw new Error("No se pudo eliminar el archivo");
            return res.json();
          }),
          {
            loading: "Eliminando archivo...",
            success: "¡Archivo eliminado!",
            error: "Error al eliminar el archivo",
          }
        );
      }

      setDocumentos((prevDocs) =>
        prevDocs.filter((doc) => doc.id !== selectedDoc.id)
      );
      setDocumentosFiltrados((prevDocs) =>
        prevDocs.filter((doc) => doc.id !== selectedDoc.id)
      );

      handleCloseModal();
    } catch (error) {
      // El toast ya lo muestra
    }
  };

  const { user } = useAuth();

  const [documentos, setDocumentos] = useState([]);

  const modalIconMap = {
    pdf: <AiFillFilePdf className="text-[#ed1c22] text-7xl" />,
    excel: <AiFillFileExcel className="text-green-500 text-7xl" />,
    word: <AiFillFileWord className="text-blue-500 text-7xl" />,
    ppt: <AiFillFilePpt className="text-orange-500 text-7xl" />,
    text: <AiFillFileText className="text-[#fb544a] text-7xl" />,
    img: <AiFillFileImage className="text-[#fea190] text-7xl" />,
    zip: <AiFillFileZip className="text-[#f8bd3a] text-7xl" />,
    carpeta: <AiFillFolder className="text-[#ffd04c] text-4xl min-w-[32px]" />,
    default: <AiFillFile className="text-gray-400 text-7xl" />,
  };

  const maxSize = 100 * 1024 * 1024; // 100 MB
  const {
    acceptedFiles,
    fileRejections,
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    maxSize,
    onDropRejected: (fileRejections) => {
      fileRejections.forEach(({ file, errors }) => {
        errors.forEach(error => {
          if (error.code === 'file-too-large') {
            toast.error(`El archivo ${file.name} es demasiado grande. Tamaño máximo permitido: ${maxSize} MB.`);
          } else {
            toast.error(`Error al subir el archivo ${file.name}: ${error.message}`);
          }
        });
      });
    }
  })

  const files = acceptedFiles.map(file => (
    <div
      key={`${file.name}-${file.size}-${file.lastModified ?? ''}`}
      className='flex flex-wrap justify-center gap-4 w-full max-w-6xl p-4'
    >
      <DocumentCard
        name={file.name}
        author={user?.nombre || "Anónimo"}
        size={`${(file.size / (1024 * 1024)).toFixed(2)} MB`}
        type={file.type}
      />
    </div>
  ));

  const handleNavigation = () => {
    handleCloseModal();
    // Persistimos nombre de carpeta al navegar (para F5)
    if (selectedDoc?.id && selectedDoc?.nombre) {
      sessionStorage.setItem(`bibFolderName:${selectedDoc.id}`, selectedDoc.nombre);
    }
    navigate(`/biblioteca/${selectedDoc.id}`)
  };

  const handleOpenFolder = (docId, docName) => {
    handleCloseModal();
    // Guardar nombre para sobrevivir a F5
    if (docId && docName) {
      sessionStorage.setItem(`bibFolderName:${docId}`, docName);
      setFolderName(docName);
    }
    navigate(`/biblioteca/${docId}`, { state: { folderName: docName } });
  };

  // ----------- NUEVO: función reutilizable para cargar contenido de la carpeta actual -----------
  const fetchFolderContents = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/biblioteca/list/${id}?orden=asc`);
      const data = await response.json();

      const archivos = (data.contentFile || []).map(file => ({
        nombre: file.nombre,
        autor: file.autor?.nombre || "Desconocido",
        size: `${(file.tamano / (1024 * 1024)).toFixed(2)} MB`,
        tag: mapTipoArchivo(file.tipoArchivo),
        url: file.url,
        id: file._id
      }));

      const carpetas = (data.contentFolder || []).map(folder => ({
        nombre: folder.nombre,
        autor: "",
        size: "",
        tag: "carpeta",
        id: folder._id
      }));

      setDocumentos([...carpetas, ...archivos]);
      setDocumentosFiltrados([...carpetas, ...archivos]);
    } catch (error) {
      console.error("Error al obtener archivos:", error);
    }
  }, [id]);
  // -----------------------------------------------------------------------------------------------

  // SUBIDA DE ARCHIVOS
  async function handleOnSubmit(params) {
    params.preventDefault();

    const data = new FormData();
    acceptedFiles.forEach((archivo) => {
      data.append("archivos", archivo);
    });
    data.append("userId", user._id);
    data.append("folderId", id);

    await toast.promise(
      fetch(`${API_URL}/biblioteca/upload/`, {
        method: 'POST',
        body: data,
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.message || 'Error al subir archivos');
          }
          return result;
        }),
      {
        loading: 'Subiendo archivos...',
        success: '¡Archivos subidos con éxito!',
        error: (err) => `Error: ${err.message}`,
        duration: 8000,
      }
    );

    // Tras subir, recarga el contenido de la carpeta actual
    fetchFolderContents();
  }

  // SEARCH
  const [nombre, setNombre] = useState('');
  const publicoParam = (user?.tipoUsuario === 0 || user?.tipoUsuario === 1) ? '' : '&publico=true';

  const handleSearch = useCallback(async () => {
    const q = nombre.trim();
    if (q === '') return; // evita sobreescribir la vista de la carpeta al montar/refrescar

    try {
      const respuesta = await fetch(
        `${API_URL}/biblioteca/list/0?nombre=${encodeURIComponent(q)}&orden=asc&global=true`
      );
      const datos = await respuesta.json();

      const archivos = (datos.contentFile || []).map(file => ({
        nombre: file.nombre,
        autor: file.autor?.nombre || "Desconocido",
        size: `${(file.tamano / (1024 * 1024)).toFixed(2)} MB`,
        tag: mapTipoArchivo(file.tipoArchivo),
        url: file.url,
        id: file._id
      }));

      const carpetas = (datos.contentFolder || []).map(folder => ({
        nombre: folder.nombre,
        autor: "",
        size: "",
        tag: "carpeta",
        id: folder._id
      }));

      setDocumentos([...carpetas, ...archivos]);
      setDocumentosFiltrados([...carpetas, ...archivos]);
    } catch (error) {
      console.error("Error al obtener archivos:", error);
    }
  }, [nombre]);

  // Lanzar búsqueda automáticamente al escribir con debounce
  useEffect(() => {
    const q = nombre.trim();
    if (q === '') return; // no dispares búsqueda global sin término

    const delayDebounce = setTimeout(() => {
      handleSearch();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [nombre, handleSearch]);

  // OBTENER CONTENIDO DE LA CARPETA ACTUAL
  useEffect(() => {
    fetchFolderContents();
  }, [fetchFolderContents]);

  // Si venimos de navegación directa (F5), recupera el nombre de la carpeta del sessionStorage
  useEffect(() => {
    if (!location.state?.folderName && id && id !== '0') {
      const memo = sessionStorage.getItem(`bibFolderName:${id}`);
      if (memo) setFolderName(memo);
    }
  }, [id, location.state?.folderName]);

  useEffect(() => {
    if (location.state?.folderName) {
      setFolderName(location.state.folderName);
    }
  }, [location.state?.folderName]);

  const mapTipoArchivo = (mime) => {
    if (!mime) return "otro";
    const m = mime.toLowerCase();
    if (m.includes("pdf")) return "pdf";
    if (m.includes("word")) return "word";
    if (m.includes("spreadsheet") || m.includes("excel")) return "excel";
    if (m.includes("presentation") || m.includes("powerpoint") || m.includes("ppt")) return "ppt";
    if (m.includes("text")) return "text";
    if (m.includes("zip") || m.includes("rar") || m.includes("7z")) return "zip";
    if (m.startsWith("image")) return "img";
    return "otro";
  };

  // *** IMPORTANTE ***
  // Se elimina el listener que hacía window.location.reload() en popstate
  // (rompía la navegación de la SPA y contribuía al “salto” a la raíz).

  const [documentosFiltrados, setDocumentosFiltrados] = useState([]);
  const [etiquetaSeleccionada, setEtiquetaSeleccionada] = useState("");

  // Filtrado combinado por nombre y etiqueta
  useEffect(() => {
    let filtrados = documentos;
    if (nombre.trim() !== "") {
      filtrados = filtrados.filter(doc => doc.nombre.toLowerCase().includes(nombre.toLowerCase()));
    }
    if (etiquetaSeleccionada !== "") {
      filtrados = filtrados.filter(doc => doc.tag.toLowerCase() === etiquetaSeleccionada);
    }
    setDocumentosFiltrados(filtrados);
  }, [nombre, etiquetaSeleccionada, documentos]);

  const handleFiltroChange = (e) => {
    setEtiquetaSeleccionada(e.target.value);
  };

  const [mostrarModal, setMostrarModal] = useState(false);
  const [nombreCarpeta, setNombreCarpeta] = useState("");

  const handleCrearCarpeta = async () => {
    if (!nombreCarpeta.trim()) return;

    await toast.promise(
      fetch(`${API_URL}/biblioteca/folder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          nombre: nombreCarpeta,
          parent: id,
        }),
      }).then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Error al crear la carpeta");
        }
        return result;
      }),
      {
        loading: "Creando carpeta...",
        success: "Carpeta creada con éxito 🎉",
        error: (err) => `Error: ${err.message}`,
        duration: 8000,
      }
    );

    // Guardar el nombre si estamos dentro de una carpeta específica
    if (id && id !== '0') {
      sessionStorage.setItem(`bibFolderName:${id}`, folderName);
    }

    setNombreCarpeta("");
    setMostrarModal(false);
    // En vez de recargar toda la página, refrescamos la lista
    fetchFolderContents();
  };

  return (
    <div className="flex flex-col items-center gap-4  bg-gray-800/80 pt-16 min-h-screen p-4 sm:p-8">

      <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,1)]">
        <span className="text-gray-200">Biblioteca</span>
      </h1>

      <p className="text-xl text-white font-semibold flex items-center gap-2">
        <AiFillFolder className="text-[#ffd04c] text-2xl" />
        {folderName}
      </p>
      {user && (user.tipoUsuario === 0 || user.tipoUsuario === 1) && (
        <div className="flex flex-wrap justify-center gap-4 w-full max-w-6xl p-4">
          <div
            {...getRootProps()}
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 rounded-xl p-8 text-center cursor-pointer transition hover:border-blue-500 hover:bg-blue-50"
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Suelta los archivos aquí ...</p>
            ) : (
              <p className="text-gray-600">
                Arrastra y suelta algunos archivos aquí, o{' '}
                <span className="text-blue-600 underline">haz clic para seleccionarlos</span>
              </p>
            )}
          </div>

          <div>
            {fileRejections.length > 0 && (
              <div className="mt-4 text-red-600">
                Algunos archivos no se pudieron subir por exceder el tamaño máximo permitido de 10 MB.
              </div>
            )}
          </div>

          {acceptedFiles.length !== 0 && (
            <div className="w-full max-w-6xl px-4 mt-6 space-y-6">

              <div className="flex justify-center">
                <button
                  onClick={handleOnSubmit}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Subir
                </button>
              </div>

              <div className="">
                {files}
              </div>
            </div>
          )}

          <div className="w-full max-w-6xl px-4 py-2 text-white">
            <button
              onClick={() => setMostrarModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium p-4 rounded-lg shadow"
            >
              + Crear carpeta
            </button>

            {mostrarModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    Nueva carpeta
                  </h3>
                  <input
                    type="text"
                    value={nombreCarpeta}
                    onChange={(e) => setNombreCarpeta(e.target.value)}
                    placeholder="Nombre de la carpeta"
                    className="w-full px-4 py-2 mb-4 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setMostrarModal(false)}
                      className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCrearCarpeta}
                      className="px-4 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Crear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4 w-full max-w-6xl p-4 text-black">
        <form className="flex flex-col md:flex-row gap-2 md:items-center w-full">

          <input
            type="text"
            placeholder="Buscar por nombre..."
            className="w-full md:w-auto flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 shadow-sm"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <select
            value={etiquetaSeleccionada}
            onChange={handleFiltroChange}
            className="w-full md:w-48 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los archivos</option>
            <option value="pdf">Pdf</option>
            <option value="excel">Excel</option>
            <option value="word">Word</option>
            <option value="ppt">Ppt</option>
            <option value="text">Texto</option>
            <option value="img">Img</option>
            <option value="zip">Zip</option>
          </select>

          <button
            className="w-full focus:ring focus:outline md:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            onClick={(e) => { e.preventDefault(); handleSearch(); }}
          >
            Buscar
          </button>

        </form>
      </div>

      <div className="flex flex-wrap justify-center gap-4 w-full max-w-6xl p-4">
        {documentosFiltrados.map((doc) => (
          <DocumentCard
            key={doc.id}
            name={doc.nombre}
            author={doc.autor}
            size={doc.size}
            type={doc.tag}
            onClick={() => {
              if (doc.tag === 'carpeta') {
                handleOpenFolder(doc.id, doc.nombre);
              } else {
                handleOpenModal(doc);
              }
            }}
          />
        ))}
      </div>

      <DocumentModal
        isOpen={!!selectedDoc}
        name={selectedDoc?.nombre}
        size={selectedDoc?.size}
        author={selectedDoc?.autor}
        icon={modalIconMap[selectedDoc?.tag] || modalIconMap.default}
        tag={selectedDoc?.tag}
        onClose={handleCloseModal}
        onRedirect={handleNavigation}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />

    </div>
  )
}

export default Biblioteca
