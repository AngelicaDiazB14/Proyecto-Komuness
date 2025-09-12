export const CategoriaBadge = ({ categoria, className = "" }) => {
  
  // Si es null/undefined
  if (!categoria) {
    return (
      <span className={`bg-blue-600 text-white text-xs px-2 py-1 rounded-full ${className}`}>
        SIN CATEGORÍA
      </span>
    );
  }

  // Si es un string (ID) en lugar de objeto populado
  if (typeof categoria === 'string') {
    return (
      <span className={`bg-blue-600 text-white text-xs px-2 py-1 rounded-full ${className}`}>
        ID: {categoria.substring(0, 8)}...
      </span>
    );
  }

  // Si es objeto pero no tiene nombre
  if (categoria._id && !categoria.nombre) {
    return (
      <span className={`bg-blue-600 text-white text-xs px-2 py-1 rounded-full ${className}`}>
        CATEGORÍA SIN NOMBRE
      </span>
    );
  }

  // Si está correctamente populado
  return (
    <span className={`bg-blue-600 text-white text-xs px-2 py-1 rounded-full ${className}`}>
      {categoria.nombre.toUpperCase()}
    </span>
  );
};

export default CategoriaBadge;