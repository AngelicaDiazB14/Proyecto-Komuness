import multer from 'multer';
import { Router } from 'express';
import {
  createPublicacion,
  getPublicacionById,
  updatePublicacion,
  deletePublicacion,
  addComentario,
  getPublicacionesByTag,
  filterPublicaciones,
  createPublicacionA,
  getPublicacionesByCategoria,
  getEventosPorFecha,
} from '../controllers/publicacion.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { verificarRoles } from '../middlewares/roles.middleware';
import { validarLimitePublicaciones } from '../middlewares/limitePublicaciones.middleware';
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// acepta 'archivos' o 'imagenes' (0..N)
const multiFields = upload.fields([
  { name: 'archivos', maxCount: 10 },
  { name: 'imagenes', maxCount: 10 },
]);

const router = Router();

// Las rutas de creación ahora incluyen validación de límites
// El middleware se aplica DESPUÉS de authMiddleware
router.post('/', authMiddleware, validarLimitePublicaciones, createPublicacion);

// Handler robusto para capturar errores de Multer (p.ej. límite de tamaño)
router.post('/v2', authMiddleware, validarLimitePublicaciones, (req, res, next) => {
  multiFields(req, res, (err: any) => {
    if (err) {
      const msg = err?.message || 'Error al subir archivos';
      const status = err?.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ ok: false, message: msg });
    }
    createPublicacionA(req, res).catch(next);
  });
});

router.get('/', getPublicacionesByTag);
router.get('/buscar', filterPublicaciones);
router.get('/:id', getPublicacionById);
router.get('/categoria/:categoriaId', getPublicacionesByCategoria);
router.put('/:id', authMiddleware, verificarRoles([0, 1]), updatePublicacion);
router.delete('/:id', authMiddleware, verificarRoles([0, 1]), deletePublicacion);
router.post('/:id/comentarios', authMiddleware, verificarRoles([0, 1, 2]), addComentario);
router.get('/eventos/calendario', getEventosPorFecha);
export default router;
