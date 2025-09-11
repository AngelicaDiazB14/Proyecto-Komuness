// components/adminCategorias.js
import { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';
import { useAuth } from './context/AuthContext';

export const AdminCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nombre: '' });
  const { user } = useAuth();

  useEffect(() => {
    if (user && (user.tipoUsuario === 0 || user.tipoUsuario === 1)) {
      fetchCategorias();
    }
  }, [user]);

  const fetchCategorias = async () => {
    try {
      const response = await fetch(`${API_URL}/categorias`);
      const data = await response.json();
      setCategorias(data.data || []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      alert('El nombre de la categoría es obligatorio');
      return;
    }

    try {
      const url = editingId 
        ? `${API_URL}/categorias/${editingId}`
        : `${API_URL}/categorias`;
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFormData({ nombre: '' });
        setEditingId(null);
        fetchCategorias();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error al guardar la categoría');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la categoría');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/categorias/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchCategorias();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error al eliminar la categoría');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la categoría');
    }
  };

  if (!user || (user.tipoUsuario !== 0 && user.tipoUsuario !== 1)) {
    return <div className="p-4 text-white">No tienes permisos para acceder a esta sección.</div>;
  }

  if (loading) {
    return <div className="p-4 text-white">Cargando categorías...</div>;
  }

  return (
    <div className="p-4 bg-gray-800/80 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-4">Administración de Categorías</h1>
      
      <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white rounded-lg">
        <h2 className="text-lg font-semibold mb-2">
          {editingId ? 'Editar Categoría' : 'Crear Nueva Categoría'}
        </h2>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ nombre: e.target.value })}
            placeholder="Nombre de la categoría"
            className="flex-1 p-2 border rounded"
            required
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
          {editingId && (
            <button 
              type="button" 
              onClick={() => {
                setFormData({ nombre: '' });
                setEditingId(null);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
      
      <div className="bg-white rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((categoria) => (
              <tr key={categoria._id} className="border-t">
                <td className="p-3">{categoria.nombre.toUpperCase()}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    categoria.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {categoria.estado ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => {
                      setFormData({ nombre: categoria.nombre });
                      setEditingId(categoria._id);
                    }}
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(categoria._id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCategorias;