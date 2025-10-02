import React, { useState, useCallback, useEffect } from 'react'
import DocumentCard from './documentCard'
import DocumentModal from './documentModal'
import { useParams, useNavigate, useLocation } from "react-router-dom"
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
import { IoMdArrowRoundBack } from "react-icons/io"
import { useDropzone } from 'react-dropzone'
import { toast } from "react-hot-toast"
import { useAuth } from "../components/context/AuthContext"
import { API_URL } from '../utils/api'

// Función auxiliar para mapear tipos de archivo
const mapTipoArchivo = (tipo) => {
  const tipoLower = tipo?.toLowerCase() || ''
   if (tipoLower.includes('pdf')) return 'pdf'
  if (tipoLower.includes('excel') || tipoLower.includes('spreadsheet')) return 'excel'
  if (tipoLower.includes('word') || tipoLower.includes('document')) return 'word'
  if (tipoLower.includes('powerpoint') || tipoLower.includes('presentation')) return 'ppt'
  if (tipoLower.includes('text')) return 'text'
  if (tipoLower.includes('image')) return 'img'
  if (tipoLower.includes('zip') || tipoLower.includes('compressed')) return 'zip'
  return 'default'
}

export const Biblioteca = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  // Estados principales
  const [folderName, setFolderName] = useState(location.state?.folderName || 'Biblioteca')
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [documentos, setDocumentos] = useState([])
  const [documentosFiltrados, setDocumentosFiltrados] = useState([])
  const [nombre, setNombre] = useState('')
  const [etiquetaSeleccionada, setEtiquetaSeleccionada] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [nombreCarpeta, setNombreCarpeta] = useState("")

  // Mapa de iconos para el modal
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
  }

  // Configuración de dropzone
   // Aumentado a 200MB. Mantener en sync con el servidor (env LIBRARY_MAX_FILE_SIZE_MB)
   const maxSize = 200 * 1024 * 1024 // 200 MB
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
             toast.error(`El archivo ${file.name} es demasiado grande. Tamaño máximo permitido: 200 MB.`)
          } else {
            toast.error(`Error al subir el archivo ${file.name}: ${error.message}`)
          }
        })
      })
    }
  })

  // Función para cargar contenido de la carpeta actual
  const fetchFolderContents = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/biblioteca/list/${id}?orden=asc`)
      const data = await response.json()

      const archivos = (data.contentFile || []).map(file => ({
        nombre: file.nombre,
        autor: file.autor?.nombre || "Desconocido",
        size: `${(file.tamano / (1024 * 1024)).toFixed(2)} MB`,
        tag: mapTipoArchivo(file.tipoArchivo),
        url: file.url,
        id: file._id
      }))

      const carpetas = (data.contentFolder || []).map(folder => ({
        nombre: folder.nombre,
        autor: "",
        size: "",
        tag: "carpeta",
        id: folder._id
      }))

      setDocumentos([...carpetas, ...archivos])
      setDocumentosFiltrados([...carpetas, ...archivos])
    } catch (error) {
      console.error("Error al obtener archivos:", error)
    }
  }, [id])

  // Handlers del modal
  const handleOpenModal = (doc) => setSelectedDoc(doc)
  const handleCloseModal = () => setSelectedDoc(null)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = selectedDoc.url
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    handleCloseModal()
  }

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
            if (!res.ok) throw new Error("No se pudo eliminar la carpeta")
            return res.json()
          }),
          {
            loading: "Eliminando carpeta...",
            success: "¡Carpeta eliminada!",
            error: "Error al eliminar la carpeta",
          }
        )
      } else {
        await toast.promise(
          fetch(`${API_URL}/biblioteca/delete/${selectedDoc.id}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
          }).then((res) => {
            if (!res.ok) throw new Error("No se pudo eliminar el archivo")
            return res.json()
          }),
          {
            loading: "Eliminando archivo...",
            success: "¡Archivo eliminado!",
            error: "Error al eliminar el archivo",
          }
        )
      }

      setDocumentos((prevDocs) =>
        prevDocs.filter((doc) => doc.id !== selectedDoc.id)
      )
      setDocumentosFiltrados((prevDocs) =>
        prevDocs.filter((doc) => doc.id !== selectedDoc.id)
      )

      handleCloseModal()
    } catch (error) {
      console.error("Error al eliminar:", error)
    }
  }

  const handleNavigation = () => {
    handleCloseModal()
    if (selectedDoc?.id && selectedDoc?.nombre) {
      sessionStorage.setItem(`bibFolderName:${selectedDoc.id}`, selectedDoc.nombre)
    }
    navigate(`/biblioteca/${selectedDoc.id}`)
  }

  const handleOpenFolder = (docId, docName) => {
    handleCloseModal()
    if (docId && docName) {
      sessionStorage.setItem(`bibFolderName:${docId}`, docName)
      setFolderName(docName)
    }
    navigate(`/biblioteca/${docId}`, { state: { folderName: docName } })
  }

  // Subir archivos
  const handleOnSubmit = async (e) => {
    e.preventDefault()

    const data = new FormData()
    acceptedFiles.forEach((archivo) => {
      data.append("archivos", archivo)
    })
    data.append("userId", user._id)
    data.append("folderId", id)

     await toast.promise(
       (async () => {
         const response = await fetch(`${API_URL}/biblioteca/upload/`, {
           method: 'POST',
           body: data,
           headers: {
             "Authorization": `Bearer ${localStorage.getItem("token")}`,
           },
         });

         // Manejo explícito de errores comunes
         if (response.status === 413) {
           // Intentar leer json si está disponible
           let body = null;
           try { body = await response.json(); } catch (_) { /* ignore */ }
           throw new Error(body?.message || 'El archivo excede el límite permitido en el servidor (413).');
         }

         if (!response.ok) {
           let body = null;
           try { body = await response.json(); } catch (_) { /* ignore */ }
           throw new Error(body?.message || `Error al subir archivos (status ${response.status}).`);
         }

         return response.json();
       })(),
       {
         loading: 'Subiendo archivos...',
         success: '¡Archivos subidos con éxito!',
         error: (err) => {
           const msg = err instanceof Error ? err.message : String(err)
           // Errores de conexión detectables por mensaje común
           if (msg.includes('NetworkError') || msg.includes('Failed to fetch') || msg.includes('ECONNRESET')) {
             return 'Hubo un problema de conexión durante la carga. Verifica tu conexión e inténtalo de nuevo.'
           }
           return `Error: ${msg}`
         },
         duration: 8000,
       }
     )

    fetchFolderContents()
  }

  // Búsqueda
  const publicoParam = (user?.tipoUsuario === 0 || user?.tipoUsuario === 1) ? '' : '&publico=true'
  
  const handleSearch = useCallback(async () => {
    const q = nombre.trim()
    if (q === '') return
    const qLower = q.toLowerCase()

    try {
      const respuesta = await fetch(
        `${API_URL}/biblioteca/search?q=${q}${publicoParam}`,
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )
      const data = await respuesta.json()

      const archivos = (data.files || []).map(file => ({
        nombre: file.nombre,
        autor: file.autor?.nombre || "Desconocido",
        size: `${(file.tamano / (1024 * 1024)).toFixed(2)} MB`,
        tag: mapTipoArchivo(file.tipoArchivo),
        url: file.url,
        id: file._id
      }))

      const carpetas = (data.folders || []).map(folder => ({
        nombre: folder.nombre,
        autor: "",
        size: "",
        tag: "carpeta",
        id: folder._id
      }))

      const todos = [...carpetas, ...archivos]
      const filtradosPorPrefijo = todos.filter(doc => 
        doc.nombre.toLowerCase().startsWith(qLower)
      )
      setDocumentos(filtradosPorPrefijo)
      setDocumentosFiltrados(filtradosPorPrefijo)
    } catch (error) {
      console.error("Error al obtener archivos:", error)
    }
  }, [nombre, publicoParam])

  // Crear carpeta
  const handleCrearCarpeta = async () => {
    if (!nombreCarpeta.trim()) return
    
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
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.message || "Error al crear la carpeta")
        }
        return result
      }),
      {
        loading: "Creando carpeta...",
        success: "Carpeta creada con éxito 🎉",
        error: (err) => `Error: ${err.message}`,
        duration: 8000,
      }
    )

    if (id && id !== '0') {
      sessionStorage.setItem(`bibFolderName:${id}`, folderName)
    }
    setNombreCarpeta("")
    setMostrarModal(false)
    fetchFolderContents()
  }

  const handleFiltroChange = (e) => {
    setEtiquetaSeleccionada(e.target.value)
  }

  const mostrarBotonVolver = () => {
    return location.pathname !== '/biblioteca'
  }

  // Renderizar archivos aceptados
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
  ))

  // Effect: Búsqueda con debounce
  useEffect(() => {
    const q = nombre.trim()
    if (q === '') {
      fetchFolderContents()
      return
    }

    const delayDebounce = setTimeout(() => {
      handleSearch()
    }, 400)
    return () => clearTimeout(delayDebounce)
  }, [nombre, handleSearch, fetchFolderContents])

  // Effect: Cargar contenido inicial
  useEffect(() => {
    fetchFolderContents()
  }, [fetchFolderContents])

  // Effect: Restaurar nombre de carpeta desde sessionStorage
  useEffect(() => {
    if (id && id !== '0') {
      const savedName = sessionStorage.getItem(`bibFolderName:${id}`)
      if (savedName) {
        setFolderName(savedName)
      }
    }
  }, [id])

  // Effect: Filtrado combinado por nombre y etiqueta
  useEffect(() => {
    let filtrados = documentos
    const q = nombre.trim().toLowerCase()
    
    if (q !== "") {
      filtrados = filtrados.filter(doc => 
        doc.nombre.toLowerCase().startsWith(q)
      )
    }
    
    if (etiquetaSeleccionada !== "") {
      filtrados = filtrados.filter(doc => 
        doc.tag.toLowerCase() === etiquetaSeleccionada
      )
    }
    
    setDocumentosFiltrados(filtrados)
  }, [nombre, etiquetaSeleccionada, documentos])

  return (
    <div className="flex flex-col items-center gap-4 bg-gray-800/80 pt-16 min-h-screen p-4 sm:p-8">
      {/* Botón de volver */}
      {mostrarBotonVolver() && (
        <div className="absolute top-22 left-11 z-20">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-md"
          >
            <IoMdArrowRoundBack color="black" size={25} />
          </button>
        </div>
      )}

      {/* Título */}
      <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,1)]">
        <span className="text-gray-200">Biblioteca</span>
      </h1>

      {/* Nombre de carpeta actual */}
      <p className="text-xl text-white font-semibold flex items-center gap-2">
        <AiFillFolder className="text-[#ffd04c] text-2xl" />
        {folderName}
      </p>

      {/* Zona de subida (solo para admin/editor) */}
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

          {fileRejections.length > 0 && (
            <div className="mt-4 text-red-600">
              Algunos archivos no se pudieron subir por exceder el tamaño máximo permitido de 100 MB.
            </div>
          )}

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
              <div>{files}</div>
            </div>
          )}

          {/* Botón crear carpeta */}
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

      {/* Barra de búsqueda y filtros */}
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
            onClick={(e) => { 
              e.preventDefault()
              handleSearch()
            }}
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Grid de documentos */}
      <div className="w-full max-w-6xl bg-white/10 rounded-xl p-4">
        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-2">
            {documentosFiltrados.map((doc) => (
              <DocumentCard
                key={doc.id}
                name={doc.nombre}
                author={doc.autor}
                size={doc.size}
                type={doc.tag}
                onClick={() => {
                  if (doc.tag === 'carpeta') {
                    handleOpenFolder(doc.id, doc.nombre)
                  } else {
                    handleOpenModal(doc)
                  }
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Contador */}
        <div className="mt-2 text-center text-white text-sm">
          Mostrando {documentosFiltrados.length} {documentosFiltrados.length === 1 ? 'elemento' : 'elementos'}
        </div>
      </div>

      {/* Modal de documento */}
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