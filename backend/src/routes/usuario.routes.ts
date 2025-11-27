import { Router } from 'express';
import {
  createUsuario,
  deleteUsuario,
  getUsuarioById,
  getUsuarios,
  updateUsuario,
  loginUsuario,
  registerUsuario,
  checkAuth,
  enviarCorreoRecuperacion,
  actualizarLimiteUsuario,
  actualizarVencimientoPremium,
  actualizarMembresiaUsuarioAdmin,
  activarPremiumActual
} from '../controllers/usuario.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { verificarRoles } from '../middlewares/roles.middleware';

const router = Router();

// Endpoint para recuperar contraseña
router.post("/recuperar-contrasena", enviarCorreoRecuperacion);

// Endpoints de autenticación
router.post('/login', loginUsuario); //login
router.post('/register', registerUsuario); //register

// ✅ PASO 3 (A): checkAuth pasa por authMiddleware para usar usuario real+aplicar downgrade
router.get('/check', authMiddleware, checkAuth); // verificar el token

// los siguientes endpoints son de uso exclusivo para el superadmin = 0
router.post('/', authMiddleware, verificarRoles([0]), createUsuario); //create
router.get('/', authMiddleware, verificarRoles([0, 1]), getUsuarios); //read

router.get('/:id', authMiddleware, verificarRoles([0]), getUsuarioById); //read by id
router.delete('/:id', authMiddleware, verificarRoles([0]), deleteUsuario); //delete

// Endpoints para administradores: gestión de límites y premium
router.put('/:id/limite', authMiddleware, verificarRoles([0, 1]), actualizarLimiteUsuario); // Actualizar límite personalizado
router.put('/:id/premium-vencimiento', authMiddleware, verificarRoles([0, 1]), actualizarVencimientoPremium); // Actualizar vencimiento premium

// Endpoints de admins/superadmin: cambiar tipoUsuario (ahora 1/2/3) con cálculo automático en premium
router.put('/:id/membresia', authMiddleware, verificarRoles([0, 1]), actualizarMembresiaUsuarioAdmin);

// este endpoint es de uso para cualquier usuario registrado
router.put('/:id', authMiddleware, verificarRoles([0, 1, 2]), updateUsuario); //update

// para cualquier usuario registrado
router.put(
  '/me/premium',
  authMiddleware,
  verificarRoles([0, 1, 2]),  // superadmin, admin, usuario normal
  activarPremiumActual
);

export default router;
