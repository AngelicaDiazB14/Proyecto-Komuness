import { Router } from "express";
import {
  getSeccionAcerca,
  createOrUpdateSeccionAcerca,
  uploadImagen,
  deleteImagen
} from "../controllers/seccionAcerca.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { verificarRoles } from "../middlewares/roles.middleware";
import multer from "multer";
import path from 'path';

const router = Router();

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Consultar sección acerca de → libre para todos
router.get("/", getSeccionAcerca);

// Crear/actualizar y subir imágenes → solo admin (tipoUsuario = 0 o 1)
router.put("/", authMiddleware, verificarRoles([0, 1]), createOrUpdateSeccionAcerca);
router.post("/upload", authMiddleware, verificarRoles([0, 1]), upload.single('imagen'), uploadImagen);
router.delete("/imagen", authMiddleware, verificarRoles([0, 1]), deleteImagen);

export default router;