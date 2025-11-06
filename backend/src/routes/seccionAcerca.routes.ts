import { Router } from "express";
import {
  getSeccionAcerca,
  createOrUpdateSeccionAcerca,
  uploadImagen,
  deleteImagen,
  downloadImagen,
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

// NUEVO: Usar uploadAcercaDe en lugar del multer local
router.post("/upload", 
  authMiddleware, 
  verificarRoles([0, 1]), 
  uploadAcercaDe.single('imagen'), 
  uploadImagen
);

router.delete("/imagen", 
  authMiddleware, 
  verificarRoles([0, 1]), 
  deleteImagen
);

export default router;