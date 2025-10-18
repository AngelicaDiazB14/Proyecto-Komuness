import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { API_URL } from '../utils/api';
import { toast } from 'react-hot-toast';
import AcercaDeView from './AcercaDeView';
import AcercaDeEdit from './AcercaDeEdit';
import '../CSS/acercaDe.css';

const AcercaDe = () => {
  const [seccionData, setSeccionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const { user } = useAuth();

  const fetchSeccionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/acerca-de`);
      
      if (!response.ok) {
        if (response.status === 0) {
          throw new Error('Error de conexión o CORS');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSeccionData(data);
    } catch (error) {
      console.error('Error detallado:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        toast.error('Error de conexión. Verifica que el servidor esté ejecutándose.');
      } else {
        toast.error(error.message || 'Error al cargar la información');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeccionData();
  }, []);

  if (loading) {
    return (
      <div className="acerca-de-loading">
        <div className="text-white">Cargando información...</div>
      </div>
    );
  }

  const isAdmin = user && (user.tipoUsuario === 0 || user.tipoUsuario === 1);

  return (
    <div className="acerca-de-container">
      {editing ? (
        <AcercaDeEdit 
          data={seccionData} 
          onUpdate={fetchSeccionData}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <AcercaDeView 
          data={seccionData} 
          onEdit={() => setEditing(true)}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default AcercaDe;