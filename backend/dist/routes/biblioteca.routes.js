"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const biblioteca_controller_1 = __importDefault(require("../controllers/biblioteca.controller"));
const multer_middleware_1 = require("../middlewares/multer.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const roles_middleware_1 = require("../middlewares/roles.middleware");
//const storage = multer.memoryStorage();
//const upload = multer({ storage });
const router = (0, express_1.Router)();
//**************** Rutas de los archivos ************************ */
/**FUNCIONA
 * Posibles respuestas del endpoint:
 * HTTP 200 (todos los archivos subidos exitosamente) o 207 (algunos archivos subidos exitosamente) :
 * {
 * success: true,
 * message:'Todos los archivos subidos exitosamente',
 * results: [
 *  {
 *      success: true,
 *      nombre: file.originalname,
 *      message: 'Archivo subido correctamente',
 *      content: archivo
 *  },...
 * ]
 * HTTP 500:
 *  {
 *      success: false,
 *      message:'Error al subir los archivos',
 *  }
 */
// solo los tipoUsuarios 0, 1 y 2 pueden subir archivos
router.post("/upload", multer_middleware_1.upload.array('archivos'), auth_middleware_1.authMiddleware, (0, roles_middleware_1.verificarRoles)([0, 1, 2]), biblioteca_controller_1.default.uploadFiles);
/**
 * Posibles respuestas del endpoint:
 * HTTP 200:
 * {
 *  success: true,
 *  message:'Archivo eliminado correctamente',
 *  results: [
 *      {
 *          success: true,
 *          nombre: file.originalname,
 *          message: 'Archivo eliminado correctamente',
 *      },...
 *  ]
 * }
 * HTTP 400:
 *  {
 *      success: false,
 *      message:'id es requerido',
 *  }
 * HTTP 404:
 *  {
 *      success: false,
 *      message:'Archivo no encontrado',
 *  }
 * HTTP 500:
 *  {
 *      success: false,
 *      message:'Error al eliminar los archivos',
 *      error: error.message
 *  }
*/
//solo los tipoUsuarios 0 y 1  pueden eliminar archivos
router.delete("/delete/:id", auth_middleware_1.authMiddleware, (0, roles_middleware_1.verificarRoles)([0, 1]), biblioteca_controller_1.default.deleteFile);
/**
 * Posibles respuestas del endpoint:
 * HTTP 200:
 *  {
 *      success: true,
 *      results: {archivo[]}
 *  }
 *
 * HTTP 404:
 *  {
 *      success: false,
 *      message:'Carpeta no encontrada',
 *  }
 * HTTP 500:
 *  {
 *      success: false,
 *      message:'Error del sistema',
 *      error: error.message
 *  }
 */
router.route("/buscar").get(biblioteca_controller_1.default.filterArchivo);
//**************************** Rutas de las carpetas ****************************** */
/**
 * FUNCIONA
 * Posibles respuestas del endpoint:
 * HTTP 200:
 * {
 *      success: true,
 *      contentFile: archivo[],
 *      contentFolder: folder[],
 * }
 * HTTP 400:
 *  {
 *      success: false,
 *      message:'id es requerido',
 *  }
 * HTTP 404:
 *  {
 *      success: false,
 *      message:'Archivo no encontrado',
 *  }
 * HTTP 500:
 *  {
 *      success: false,
 *      message:'Error al eliminar los archivos',
 *      error: error.message
 *  }
 */
router.get("/list/:id", /*authMiddleware, verificarRoles([0, 1]),*/ biblioteca_controller_1.default.list);
/**FUNCIONA
 * Posibles respuestas del endpoint:
 * HTTP 200:
 * {
 *      success: true,
 *      message:'Carpeta creada correctamente',
 *      content: folder,
 * }
 * HTTP 400:
 *  {
 *      success: false,
 *      message:'nombre y parent es requerido',
 *  }
 * HTTP 500:
 *  {
 *      success: false,
 *      message:'Error al crear la carpeta',
 *      error: error.message
 *  }
 */
//solo los tipoUsuarios 0 y 1  pueden crear carpetas
router.post("/folder", auth_middleware_1.authMiddleware, (0, roles_middleware_1.verificarRoles)([0, 1]), biblioteca_controller_1.default.createFolder);
/**
 * Posibles respuestas del endpoint:
 * HTTP 200:
 * {
 *      success: rue,
 *      message:'Carpeta eliminada correctamente',
 *      content: folder,
 * }
 * HTTP 400:
 *  {
 *      success: false,
 *      message:'id es requerido',
 *  }
 * HTTP 404:
 *  {
 *      success: false,
 *      message:'Carpeta no encontrada',
 *  }
 * HTTP 500:
 *  {
 *      success: false,
 *      message:'Error del sistema',
 *      error: error.message
 *  }
 */
//solo los tipoUsuarios 0 y 1  pueden eliminar carpetas
router.route("/folder/:id").delete(auth_middleware_1.authMiddleware, (0, roles_middleware_1.verificarRoles)([0, 1]), biblioteca_controller_1.default.deleteFolder);
/**
 * Posibles respuestas del endpoint: actualizacion de los metadatos del archivo
 * HTTP 200:
 *  {
 *      success: true,
 *      message:'Archivo actualizado correctamente',
 *      content: archivo,
 *  }
 * HTTP 400:
 *  {
 *      success: false,
 *      message:'id es requerido',
 *  }
 * HTTP 404:
 *  {
 *      success: false,
 *      message:'Archivo no encontrado',
 *  }
 * HTTP 500:
 *  {
 *      success: false,
 *      message:'Error del sistema',
 *      error: error.message
 *  }
 *
 */
//solo los tipoUsuarios 0 y 1  pueden actualizar archivos
router.put("/edit/:id", auth_middleware_1.authMiddleware, (0, roles_middleware_1.verificarRoles)([0, 1]), biblioteca_controller_1.default.updateFile);
exports.default = router;
