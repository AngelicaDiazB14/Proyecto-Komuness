import { Router } from 'express';
import {
    getConfiguraciones,
    getConfiguracionPorClave,
    actualizarConfiguracion,
    actualizarLimitesPublicaciones,
    getMisLimitesPublicaciones,
    deleteConfiguracion
} from '../controllers/configuracion.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { verificarRoles } from '../middlewares/roles.middleware';

const router = Router();

// Endpoint público para que cualquier usuario autenticado vea sus límites
router.get('/mis-limites', authMiddleware, getMisLimitesPublicaciones);

// Endpoints para administradores (super-admin y admin)
router.get('/', authMiddleware, verificarRoles([0, 1]), getConfiguraciones);
router.get('/:clave', authMiddleware, verificarRoles([0, 1]), getConfiguracionPorClave);

// Endpoint específico para actualizar límites de publicaciones (más fácil de usar)
router.put('/limites-publicaciones', authMiddleware, verificarRoles([0, 1]), actualizarLimitesPublicaciones);

// Endpoint genérico para actualizar cualquier configuración
router.put('/', authMiddleware, verificarRoles([0, 1]), actualizarConfiguracion);

// Solo super-admin puede eliminar configuraciones
router.delete('/:clave', authMiddleware, verificarRoles([0]), deleteConfiguracion);

export default router;
