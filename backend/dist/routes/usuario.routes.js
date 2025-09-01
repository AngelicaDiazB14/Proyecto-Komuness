"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usuario_controller_1 = require("../controllers/usuario.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const roles_middleware_1 = require("../middlewares/roles.middleware");
const router = (0, express_1.Router)();
// Endpoint para recuperar contraseña
router.post("/recuperar-contrasena", usuario_controller_1.enviarCorreoRecuperacion);
// Endpoints de autenticación
router.post('/login', usuario_controller_1.loginUsuario); //login
router.post('/register', usuario_controller_1.registerUsuario); //register
router.get('/check', usuario_controller_1.checkAuth); // verificar el token
//los siguientes endpoints son de uso exclusivo para el superadmin = 0
router.post('/', auth_middleware_1.authMiddleware, (0, roles_middleware_1.verificarRoles)([0]), usuario_controller_1.createUsuario); //create
router.get('/', auth_middleware_1.authMiddleware, (0, roles_middleware_1.verificarRoles)([0, 1]), usuario_controller_1.getUsuarios); //read
router.get('/:id', auth_middleware_1.authMiddleware, (0, roles_middleware_1.verificarRoles)([0]), usuario_controller_1.getUsuarioById); //read by id
router.delete('/:id', auth_middleware_1.authMiddleware, (0, roles_middleware_1.verificarRoles)([0]), usuario_controller_1.deleteUsuario); //delete
// este endpoint es de uso para cualquier usuario registrado
router.put('/:id', auth_middleware_1.authMiddleware, (0, roles_middleware_1.verificarRoles)([0, 1, 2]), usuario_controller_1.updateUsuario); //update
// para cualquier usuario registrado o no registrados
exports.default = router;
