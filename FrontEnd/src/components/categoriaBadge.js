export const CategoriaBadge = ({ categoria, className = "" }) => {
  if (!categoria || !categoria.nombre) {
    return (
      <span className={`bg-blue-500 text-white text-xs px-2 py-1 rounded-full ${className}`}>
        SIN CATEGORÍA
      </span>
    );
  }

  return (
    <span className={`bg-blue-500 text-white text-xs px-2 py-1 rounded-full ${className}`}>
      {categoria.nombre.toUpperCase()}
    </span>
  );
};

export default CategoriaBadge;