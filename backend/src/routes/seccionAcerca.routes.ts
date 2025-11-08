import { Router } from "express";
import {
  getSeccionAcerca,
  createOrUpdateSeccionAcerca,
  uploadImagen,
  deleteImagen,
  downloadImagen,
  uploadImagenMiembro,  
  deleteImagenMiembro,   
  uploadAcercaDe  // Importar el multer configurado
} from "../controllers/seccionAcerca.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { verificarRoles } from "../middlewares/roles.middleware";

const router = Router();

// Consultar sección acerca de → libre para todos
router.get("/", getSeccionAcerca);

// Descarga de imágenes → libre para todos
router.get("/files/:key", downloadImagen);

// Crear/actualizar y subir imágenes → solo admin (tipoUsuario = 0 o 1)
router.put("/", authMiddleware, verificarRoles([0, 1]), createOrUpdateSeccionAcerca);

// Usar uploadAcercaDe en lugar del multer local
router.post("/upload", 
  authMiddleware, 
  verificarRoles([0, 1]), 
  uploadAcercaDe.single('imagen'), 
  uploadImagen
);

// Subir imagen de perfil para miembro del equipo
router.post("/upload-miembro", 
  authMiddleware, 
  verificarRoles([0, 1]), 
  uploadAcercaDe.single('imagen'), 
  uploadImagenMiembro
);

// Eliminar imágenes
router.delete("/imagen", 
  authMiddleware, 
  verificarRoles([0, 1]), 
  deleteImagen
);

// Eliminar imagen de perfil de miembro
router.delete("/imagen-miembro", 
  authMiddleware, 
  verificarRoles([0, 1]), 
  deleteImagenMiembro
);

export default router;