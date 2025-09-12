import React from 'react';
import { useLocation } from 'react-router-dom';
import { Publicaciones } from './publicaciones';

export const LandingPage = () => {
  const location = useLocation();
  
  // Determinar el tag basado en la ruta actual
  const getTagFromPath = () => {
    const path = location.pathname;
    if (path === '/eventos') return 'evento';
    if (path === '/emprendimientos') return 'emprendimiento';
    if (path === '/publicaciones') return 'publicacion';
    return null;
  };

  const tag = getTagFromPath();

  return (
    <div>
      <Publicaciones tag={tag} />
    </div>
  );
};

export default LandingPage;