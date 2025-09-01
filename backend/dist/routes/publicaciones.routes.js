"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const express_1 = require("express");
const publicacion_controller_1 = require("../controllers/publicacion.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const roles_middleware_1 = require("../middlewares/roles.middleware");
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
const router = (0, express_1.Router)();
router.post('/', publicacion_controller_1.createPublicacion); // create
//Solo los tipoUsuarios 0 , 1 y 2 pueden crear publicaciones
router.post("/v2", upload.array('archivos'), /*authMiddleware, verificarRoles([0, 1, 2]),*/ publicacion_controller_1.createPublicacionA); //crear con la imagen adjunto
router.get('/', publicacion_controller_1.getPublicacionesByTag); // read
router.get('/buscar', publicacion_controller_1.filterPublicaciones); // get all publicaciones
router.get('/:id', publicacion_controller_1.getPublicacionById); // read by id
//Solo los tipoUsuarios 0 y 1 pueden actualizar publicaciones
router.put('/:id', auth_middleware_1.authMiddleware, (0, roles_middleware_1.verificarRoles)([0, 1]), publicacion_controller_1.updatePublicacion); // update    
//Solo los tipoUsuarios 0 y 1 pueden eliminar publicaciones
router.delete('/:id', auth_middleware_1.authMiddleware, (0, roles_middleware_1.verificarRoles)([0, 1]), publicacion_controller_1.deletePublicacion); //delete
//Solo los tipoUsuarios 0, 1 y 2 pueden agregar comentarios
router.post('/:id/comentarios', auth_middleware_1.authMiddleware, (0, roles_middleware_1.verificarRoles)([0, 1, 2]), publicacion_controller_1.addComentario); // add comentario
exports.default = router;
