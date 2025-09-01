"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const archivo_model_1 = require("../models/archivo.model");
const folder_model_1 = require("../models/folder.model");
const digitalOceanSpace_1 = require("../utils/digitalOceanSpace");
const mongoose_1 = __importDefault(require("mongoose"));
class BibliotecaController {
    /**
     * @description: Sube los archivos a la biblioteca en digitalOcean spaces y guarda los metadatos en la base de datos
     * @route: POST /api/biblioteca/uploadFiles
     * @param req: Request
     * @param res: Response
     * @returns: Response
     */
    static uploadFiles(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { folderId, userId } = req.body;
            console.log(folderId, userId);
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'userId es requerido',
                    errors: []
                });
            }
            const files = req.files;
            if (!files || files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No se han enviado archivos.',
                    errors: []
                });
            }
            try {
                const results = yield Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        //subir archivo a digitalOcean spaces
                        const result = yield (0, digitalOceanSpace_1.uploadFileStorage)(file, folderId);
                        if (!result) {
                            return {
                                success: false,
                                nombre: file.originalname,
                                message: 'Error al subir el archivo',
                                content: null
                            };
                        }
                        //guardar los metadatos del archivo en la base de datos
                        const archivo = new archivo_model_1.Archivo({
                            nombre: file.originalname,
                            fechaSubida: new Date(),
                            tipoArchivo: file.mimetype,
                            tamano: file.size,
                            autor: userId,
                            esPublico: false,
                            url: result.location, // Asignar la URL devuelta
                            key: result.key, // Asignar la key devuelta
                            folder: folderId
                        });
                        //guardar archivo en la base de datos
                        yield archivo.save();
                        //guardando el estado de la subida en digitalOcean spaces y en la base de datos
                        return {
                            success: true,
                            nombre: file.originalname,
                            message: 'Archivo subido correctamente',
                            content: archivo
                        };
                    }
                    catch (error) {
                        console.error('Error detallado:', error); // Mejor logging
                        return {
                            success: false,
                            nombre: file.originalname,
                            message: error instanceof Error ? error.message : 'Error interno al procesar el archivo',
                            content: null
                        };
                    }
                })));
                // Verificar si hay errores en alguna de las respuestas
                const hasErrors = results.some(r => !r.success);
                // Respuesta final al cliente
                return res.status(hasErrors ? 207 : 200).json({
                    success: !hasErrors,
                    message: hasErrors ? 'Algunos archivos no se subieron correctamente' : 'Todos los archivos subidos exitosamente',
                    results
                });
            }
            catch (error) {
                console.error('Error general:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                    error: error instanceof Error ? error.message : 'An unknown error occurred'
                });
            }
        });
    }
    /**
     * @description: Lista el contenido de una carpeta de la biblioteca (archivos y carpetas)
     * @route: GET /api/biblioteca/list/:id
     * si su id es 0, entonces se listan los archivos y carpetas de la raiz
     * de lo contrario, se listan los archivos y carpetas de la carpeta con el id especificado
     * @param req: Request
     * @param res: Response
     * @returns: Response
     */
    static list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { nombre, global, publico, orden } = req.query;
            const ordenamiento = orden === 'asc' ? 1 : -1;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'id es requerido',
                    errors: []
                });
            }
            // generar el objectid basado en el id del param
            //no validar si no generarlo
            if (!mongoose_1.default.Types.ObjectId.isValid(id) && id !== '0') {
                return res.status(400).json({
                    success: false,
                    message: 'id es inválido',
                    errors: []
                });
            }
            // Modificar en la construcción de queryArchivos
            const queryArchivos = Object.assign(Object.assign(Object.assign({}, (global !== 'true' && {
                folder: id !== '0' ? new mongoose_1.default.Types.ObjectId(id) : null
            })), (nombre && { nombre: { $regex: nombre, $options: 'i' } })), (publico !== undefined && { esPublico: publico === 'true' }));
            // Y en queryFolders
            const queryFolders = Object.assign(Object.assign({}, (global !== 'true' && {
                directorioPadre: id !== '0' ? new mongoose_1.default.Types.ObjectId(id) : null
            })), (nombre && { nombre: { $regex: nombre, $options: 'i' } }));
            try {
                console.log('Query archivos:', queryArchivos);
                console.log('Query folders:', queryFolders);
                const archivos = yield archivo_model_1.Archivo.find(queryArchivos)
                    .populate('autor', 'nombre')
                    .collation({ locale: 'es', strength: 2 })
                    .sort({ nombre: ordenamiento });
                const folders = yield folder_model_1.Folder.find(queryFolders)
                    .collation({ locale: 'es', strength: 2 })
                    .sort({ nombre: ordenamiento });
                return res.status(200).json({
                    success: true,
                    contentFile: archivos,
                    contentFolder: folders
                });
            }
            catch (error) {
                console.error('Error general:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                    error: error instanceof Error ? error.message : 'An unknown error occurred'
                });
            }
        });
    }
    /**
     * @description: Crea una carpeta en la biblioteca
     * @route: POST /api/biblioteca/folder
     * @param req: Request
     * @param res: Response
     * @returns: Response
     */
    static createFolder(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { nombre, parent } = req.body;
            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    message: 'nombre es requerido',
                    errors: []
                });
            }
            try {
                const folder = new folder_model_1.Folder({
                    nombre,
                    fechaCreacion: new Date(),
                    directorioPadre: parent
                });
                yield folder.save();
                return res.status(200).json({
                    success: true,
                    message: 'Carpeta creada correctamente',
                    content: folder
                });
            }
            catch (error) {
                console.error('Error general:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                    error: error instanceof Error ? error.message : 'An unknown error occurred'
                });
            }
        });
    }
    /**
     * Función para eliminar un archivo de la biblioteca (modular, debido a que hay 2 funciones que la llaman)
     * @param id
     * @returns boolean
     */
    static deleteFileById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const archivo = yield archivo_model_1.Archivo.findById(id);
                if (!archivo)
                    return false;
                // Eliminar el archivo de la biblioteca
                yield archivo_model_1.Archivo.findByIdAndDelete(id);
                return true;
            }
            catch (error) {
                console.error(`Error en la función: ${this.constructor.name}\n Error general:${error}`);
                return false;
            }
        });
    }
    /**
     * @description: Elimina un archivo de la biblioteca
     * @route: DELETE /api/biblioteca/deleteFile/:id
     * @param req: Request
     * @param res: Response
     * @returns: Response
     */
    static deleteFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'id es requerido',
                    errors: []
                });
            }
            try {
                const archivo = yield archivo_model_1.Archivo.findById(id);
                if (!archivo) {
                    return res.status(404).json({
                        success: false,
                        message: 'Archivo no encontrado',
                        errors: []
                    });
                }
                // Eliminar el archivo de la biblioteca
                yield BibliotecaController.deleteFileById(id);
                return res.status(200).json({
                    success: true,
                    message: 'Archivo eliminado correctamente',
                    content: archivo
                });
            }
            catch (error) {
                console.error('Error general:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                    error: error instanceof Error ? error.message : 'An unknown error occurred'
                });
            }
        });
    }
    /**
     * @description: Elimina una carpeta de la biblioteca
     * @route: DELETE /api/biblioteca/deleteFolder/:id
     * @param req: Request
     * @param res: Response
     * @returns: Response
     */
    static deleteFolder(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'id es requerido',
                    errors: []
                });
            }
            try {
                const folder = yield folder_model_1.Folder.findById(id);
                const archivos = yield archivo_model_1.Archivo.find({ folder: id });
                if (!folder) {
                    return res.status(404).json({
                        success: false,
                        message: 'Carpeta no encontrada',
                        errors: []
                    });
                }
                // Eliminar la carpeta de la biblioteca
                yield folder_model_1.Folder.findByIdAndDelete(id);
                //luego, eliminar todos los archivos que esten dentro de la carpeta
                for (const archivo of archivos) {
                    yield BibliotecaController.deleteFileById(((_a = archivo._id) === null || _a === void 0 ? void 0 : _a.toString()) || '');
                }
                return res.status(200).json({
                    success: true,
                    message: 'Carpeta y archivos eliminados correctamente',
                    content: folder
                });
            }
            catch (error) {
                console.error('Error general:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                    error: error instanceof Error ? error.message : 'An unknown error occurred'
                });
            }
        });
    }
    /**
     * @description: Busca un archivo de la biblioteca
     * @route: GET /biblioteca/search?params=values
     *   @param texto: Texto a buscar en el nombre del archivo o tipoArchivo (o folder)
     *   @param tipoArchivo: Tipo de archivo a buscar
     *   @param autor: ID del autor del archivo
     * @param req: Request
     * @param res: Response
     * @returns: Response
     */
    static filterArchivo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { texto, tipoArchivo, autor } = req.query;
                const filtro = {};
                let carpetasCoincidentes = [];
                // Filtro por texto (nombre del archivo o tipoArchivo)
                if (texto) {
                    filtro.$or = [
                        { nombre: { $regex: texto, $options: 'i' } },
                        { tipoArchivo: { $regex: texto, $options: 'i' } }
                    ];
                    carpetasCoincidentes = yield folder_model_1.Folder.find({
                        nombre: { $regex: texto, $options: 'i' }
                    });
                }
                // Filtro por tipo de archivo (por si se desea buscar por tipo aparte de la barra de búsqueda)
                if (tipoArchivo) {
                    filtro.tipoArchivo = { $regex: tipoArchivo, $options: 'i' };
                }
                // Filtro por autor (asegura que sea un ObjectId válido si aplica)
                if (autor) {
                    if (!mongoose_1.default.Types.ObjectId.isValid(autor)) {
                        res.status(400).json({ message: 'ID de autor inválido' });
                        return;
                    }
                    filtro.autor = autor;
                }
                // Si no hay ningún filtro válido, no hacemos búsqueda
                if (Object.keys(filtro).length === 0 && !texto) {
                    res.status(400).json({ message: 'Debe proporcionar al menos un parámetro de búsqueda' });
                    return;
                }
                // Buscar archivos según filtros
                const archivos = yield archivo_model_1.Archivo.find(filtro).populate('folder');
                // Si no hay resultados en ambos
                if (archivos.length === 0 && carpetasCoincidentes.length === 0) {
                    res.status(404).json({ message: 'No se encontraron resultados con esos criterios' });
                    return;
                }
                res.status(200).json({
                    carpetas: carpetasCoincidentes,
                    archivos
                });
            }
            catch (error) {
                const err = error;
                res.status(500).json({ message: err.message });
            }
        });
    }
    static updateFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const data = req.body;
                const resultado = yield archivo_model_1.Archivo.findByIdAndUpdate(id, data, { new: true });
                if (!resultado) {
                    res.status(404).json({
                        message: 'No se pudo editar el archivo'
                    });
                    return;
                }
                res.status(200).json({
                    resultado
                });
            }
            catch (error) {
                const err = error;
                res.status(500).json({
                    message: err.message
                });
            }
        });
    }
}
exports.default = BibliotecaController;
