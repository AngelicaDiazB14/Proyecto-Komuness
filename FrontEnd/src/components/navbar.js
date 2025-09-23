import React from "react";
import "../CSS/navbar.css";
import { AiOutlineUser } from "react-icons/ai";
import logo from "../images/logo.png";
import { useNavigate, Link, useLocation } from "react-router-dom";

export const Navbar = () => {
  var usuario = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();

  var goToLogin;
  if(usuario !== null ){
    goToLogin = true;
  }else{
    goToLogin = false;
  }

  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Función para determinar si una ruta está activa
  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="navbar">
      <Link to="/"><img src={logo} className="logo" alt="Logo Komuness" /></Link>
      <nav>
        <ul className="menu">
          <li 
            onClick={() => handleNavigation("/publicaciones")}
            className={isActive("/publicaciones") ? "activo" : ""}
          >
            <span>Publicaciones</span>
          </li>
          <li 
            onClick={() => handleNavigation("/eventos")}
            className={isActive("/eventos") ? "activo" : ""}
          >
            <span>Eventos</span>
          </li>
          <li 
            onClick={() => handleNavigation("/emprendimientos")}
            className={isActive("/emprendimientos") ? "activo" : ""}
          >
            <span>Emprendimientos</span>
          </li>
          <li 
            onClick={() => handleNavigation("/biblioteca/0")}
            className={isActive("/biblioteca") ? "activo" : ""}
          >
            <span>Biblioteca</span>
          </li> 
          <li 
            onClick={() => handleNavigation("/calendario")}
            className={isActive("/calendario") ? "activo" : ""}
          > 
            <span>Calendario</span>
          </li> 
         
          <li 
            onClick={() => handleNavigation(goToLogin ? "/perfilUsuario" : "/iniciarSesion")}
            className={isActive("/perfilUsuario") || isActive("/iniciarSesion") ? "activo" : ""}
          >
            <AiOutlineUser className="user-icon" />
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;