import { Router } from 'express';
import { 
  obtenerProfesionales, 
  toggleBancoProfesionales, 
  quitarDelBanco,
  obtenerEstadoBanco 
} from '../controllers/bancoProfesionales.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { verificarRoles } from '../middlewares/roles.middleware';

const router = Router();

// Ruta pública - obtener listado de profesionales
router.get('/', obtenerProfesionales);

// Rutas protegidas
router.get('/estado', authMiddleware, obtenerEstadoBanco);
router.put('/toggle', authMiddleware, toggleBancoProfesionales);

// Ruta solo para administradores
router.put('/:id/quitar', authMiddleware, verificarRoles([0, 1]), quitarDelBanco);

export default router;