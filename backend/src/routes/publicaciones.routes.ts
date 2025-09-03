import multer from "multer";
import { Router } from 'express';
import {
  createPublicacion, getPublicacionById, updatePublicacion, deletePublicacion,
  addComentario, getPublicacionesByTag, filterPublicaciones, createPublicacionA, getPublicacionesByCategoria
} from '../controllers/publicacion.controller';
import { authMiddleware } from "../middlewares/auth.middleware";
import { verificarRoles } from "../middlewares/roles.middleware";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// ✅ Acepta 'archivos' o 'imagenes' y permite 0..N archivos
const multiFields = upload.fields([
  { name: 'archivos', maxCount: 10 },
  { name: 'imagenes', maxCount: 10 },
]);

const router = Router();

router.post('/', createPublicacion); // create

// ✅ Crear publicación con adjuntos opcionales (0..N)
router.post("/v2", multiFields, /*authMiddleware, verificarRoles([0, 1, 2]),*/ createPublicacionA);

router.get('/', getPublicacionesByTag); // read
router.get('/buscar', filterPublicaciones);
router.get('/:id', getPublicacionById);
router.get('/categoria/:categoriaId', getPublicacionesByCategoria);
router.put('/:id', authMiddleware, verificarRoles([0, 1]), updatePublicacion);
router.delete('/:id', authMiddleware, verificarRoles([0, 1]), deletePublicacion);
router.post('/:id/comentarios', authMiddleware, verificarRoles([0, 1, 2]), addComentario);

export default router;
