import { Router } from 'express';
import { 
  obtenerPerfilPublico, 
  obtenerMiPerfil, 
  crearOActualizarPerfil,
  subirFotoPerfil,
  subirCV,
  eliminarCV,
  actualizarCorreoPrincipal
} from '../controllers/perfil.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadFotoPerfil, uploadCV } from '../middlewares/multer.middleware';

const router = Router();

// Rutas públicas
router.get('/:id', obtenerPerfilPublico); // Obtener perfil público

// Rutas protegidas (requieren autenticación)
router.get('/usuario/me', authMiddleware, obtenerMiPerfil); // Obtener mi perfil
router.post('/', authMiddleware, crearOActualizarPerfil); // Crear/actualizar perfil
router.put('/foto', authMiddleware, uploadFotoPerfil.single('foto'), subirFotoPerfil); // Subir foto
router.put('/cv', authMiddleware, uploadCV.single('cv'), subirCV); // Subir CV
router.delete('/cv', authMiddleware, eliminarCV); // Eliminar CV
router.put('/correo-principal', authMiddleware, actualizarCorreoPrincipal); // Actualizar correo

export default router;
