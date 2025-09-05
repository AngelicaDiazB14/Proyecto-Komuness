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
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});
// acepta 'archivos' o 'imagenes' (0..N)
const multiFields = upload.fields([
    { name: 'archivos', maxCount: 10 },
    { name: 'imagenes', maxCount: 10 },
]);
const router = (0, express_1.Router)();
router.post('/', publicacion_controller_1.createPublicacion);
// Handler robusto para capturar errores de Multer (p.ej. límite de tamaño)
router.post('/v2', (req, res, next) => {
    multiFields(req, res, (err) => {
        if (err) {
            const msg = (err === null || err === void 0 ? void 0 : err.message) || 'Error al subir archivos';
            const status = (err === null || err === void 0 ? void 0 : err.code) === 'LIMIT_FILE_SIZE' ? 413 : 400;
            return res.status(status).json({ ok: false, message: msg });
        }
        (0, publicacion_controller_1.createPublicacionA)(req, res).catch(next);
    });
});
router.get('/', publicacion_controller_1.getPublicacionesByTag);
router.get('/buscar', publicacion_controller_1.filterPublicaciones);
router.get('/:id', publicacion_controller_1.getPublicacionById);
router.get('/categoria/:categoriaId', publicacion_controller_1.getPublicacionesByCategoria);
router.put('/:id', auth_middleware_1.authMiddleware, (0, roles_middleware_1.verificarRoles)([0, 1]), publicacion_controller_1.updatePublicacion);
router.delete('/:id', auth_middleware_1.authMiddleware, (0, roles_middleware_1.verificarRoles)([0, 1]), publicacion_controller_1.deletePublicacion);
router.post('/:id/comentarios', auth_middleware_1.authMiddleware, (0, roles_middleware_1.verificarRoles)([0, 1, 2]), publicacion_controller_1.addComentario);
exports.default = router;
