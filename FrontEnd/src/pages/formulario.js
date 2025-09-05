import { useState, useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { useAuth } from "../components/context/AuthContext";
import { API_URL } from "../utils/api";
import { toast } from "react-hot-toast";

export const FormularioPublicacion = ({ isOpen, onClose, openTag }) => {
  const { user } = useAuth();

  const valoresIniciales = {
    titulo: "",
    contenido: "",
    autor: "",
    fecha: new Date().toLocaleDateString(),
    archivos: [],
    comentarios: [],
    tag: "",
    publicado: false,
    fechaEvento: "",
    precio: "",
    categoria: "", // <- permitir setear si lo agregas al UI
  };

  const [formData, setFormData] = useState({
    ...valoresIniciales,
    tag: openTag || "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...valoresIniciales, tag: openTag || "" });
    }
  }, [isOpen, openTag]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({ ...prev, archivos: [...prev.archivos, ...files] }));
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      archivos: prev.archivos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("titulo", formData.titulo);
    data.append("contenido", formData.contenido);
    data.append("autor", user?._id || "");
    data.append("fecha", formData.fecha);
    data.append("tag", formData.tag);
    data.append("publicado", String(formData.publicado));
    data.append("fechaEvento", formData.fechaEvento);
    data.append("precio", formData.precio);
    data.append("categoria", formData.categoria || ""); // <- si va vacío, backend puede usar DEFAULT_CATEGORIA_ID

    formData.archivos.forEach((archivo) => {
      data.append("archivos", archivo);
    });

    try {
      await enviarPublicacion(data);
      onClose?.();
    } catch {}
  };

  const enviarPublicacion = async (data) => {
    const promise = fetch(`${API_URL}/publicaciones/v2/`, {
      method: "POST",
      body: data,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    }).then(async (response) => {
      // Si viene HTML (nginx/502), evitar error de JSON
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error("Respuesta inesperada del servidor.");
      }

      if (!response.ok) {
        throw new Error(result?.message || result?.mensaje || "Error al enviar publicación.");
      }
      return result;
    });

    return toast.promise(promise, {
      loading: "Enviando publicación...",
      success: "Publicación enviada con éxito, solicita a un administrador que la publique 🎉",
      error: (err) => err.message || "Error al enviar la publicación",
      duration: 8000,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 px-4 overflow-y-auto">
        <div className="max-w-3xl w-full bg-white text-zinc-950 shadow-md rounded-lg p-4 md:p-6">
          <form onSubmit={handleSubmit} className="grid gap-4">
            {/* móvil */}
            <div className="md:hidden flex justify-between w-full  mb-4">
              <button type="button" onClick={onClose} className="text-gray-600 text-2xl font-bold">
                <IoMdClose size={35} />
              </button>
              <button type="submit" className="bg-blue-600 text-white text-sm px-3 py-1 rounded">
                Publicar
              </button>
            </div>

            {/* Título */}
            <div>
              <label className="block font-semibold">Título:</label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                maxLength={100}
                className="w-full p-2 border rounded"
                required
              />
              <p className="text-sm text-gray-500">{formData.titulo.length}/100 caracteres</p>
            </div>

            {/* Tag (categoría funcional del sitio) */}
            <div>
              <label className="block font-semibold">Categoría (tag):</label>
              <select
                name="tag"
                value={formData.tag}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Selecciona una categoría</option>
                <option value="publicacion">Publicación</option>
                <option value="evento">Evento</option>
                <option value="emprendimiento">Emprendimiento</option>
              </select>
            </div>

            {/* (Opcional) ID de categoría de Mongo (si decides mostrarlo) */}
            {/* 
            <div>
              <label className="block font-semibold">ID de categoría (Mongo):</label>
              <input
                type="text"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="64f3... ObjectId"
              />
            </div>
            */}

            {/* Descripción */}
            <div>
              <label className="block font-semibold">Descripción:</label>
              <textarea
                name="contenido"
                value={formData.contenido}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder={`Numero de telefono:
Enlace de contacto:
Descripción del evento:`}
                rows="4"
                required
              />
            </div>

            {/* Precio */}
            {(formData.tag === "evento" || formData.tag === "emprendimiento") && (
              <div>
                <label className="block font-semibold">Precio en colones:</label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            )}

            {/* Imágenes */}
            <div>
              <label className="block font-semibold">Imágenes:</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full p-2 border rounded"
                required={formData.tag !== "publicacion"}
              />
            </div>

            {/* Previsualización */}
            {formData.archivos.length > 0 && (
              <div className="mt-3">
                <h3 className="font-semibold mb-2">Vista previa:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {formData.archivos.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Imagen ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-full"
                      >
                        <IoMdClose />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fecha de evento */}
            {formData.tag === "evento" && (
              <div>
                <label className="block font-semibold">Fecha del evento:</label>
                <input
                  type="date"
                  name="fechaEvento"
                  value={formData.fechaEvento}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            )}

            {/* botones desktop */}
            <div className="hidden md:flex justify-between gap-3 mt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-400 text-white rounded w-full md:w-auto">
                Volver
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded w-full md:w-auto">
                Publicar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default FormularioPublicacion;
