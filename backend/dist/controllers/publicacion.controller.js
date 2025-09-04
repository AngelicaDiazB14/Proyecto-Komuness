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
exports.filterPublicaciones = exports.addComentario = exports.deletePublicacion = exports.updatePublicacion = exports.getPublicacionesByCategoria = exports.getPublicacionById = exports.getPublicacionesByTag = exports.createPublicacionA = exports.createPublicacion = void 0;
const publicacion_model_1 = require("../models/publicacion.model");
const mongoose_1 = __importDefault(require("mongoose"));
const gridfs_1 = require("../utils/gridfs");
// Crear una publicación (sin adjuntos)
const createPublicacion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const publicacion = req.body;
        const nuevaPublicacion = new publicacion_model_1.modelPublicacion(publicacion);
        const savePost = yield nuevaPublicacion.save();
        res.status(201).json(savePost);
    }
    catch (error) {
        const err = error;
        res.status(500).json({ message: err.message });
    }
});
exports.createPublicacion = createPublicacion;
// Crear publicación con adjuntos v2 (GridFS)
const createPublicacionA = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const publicacion = req.body;
        // --- Recolectar archivos desde Multer (array o fields) ---
        let files = [];
        if (Array.isArray(req.files)) {
            files = req.files;
        }
        else if (req.files && typeof req.files === 'object') {
            const map = req.files;
            files = [...((_a = map['archivos']) !== null && _a !== void 0 ? _a : []), ...((_b = map['imagenes']) !== null && _b !== void 0 ? _b : [])];
        }
        // --- Validar/establecer categoria ---
        let categoria = publicacion.categoria;
        if (!categoria) {
            const defId = process.env.DEFAULT_CATEGORIA_ID;
            if (defId && mongoose_1.default.Types.ObjectId.isValid(defId)) {
                categoria = defId;
            }
            else {
                res.status(400).json({
                    ok: false,
                    message: 'categoria es requerida (envía "categoria" o configura DEFAULT_CATEGORIA_ID en .env)'
                });
                return;
            }
        }
        // --- Subir adjuntos (0..N) ---
        const adjuntos = [];
        for (const file of files) {
            const result = yield (0, gridfs_1.saveMulterFileToGridFS)(file, 'publicaciones');
            adjuntos.push({
                url: `${process.env.PUBLIC_BASE_URL || 'http://159.54.148.238'}/api/files/${result.id.toString()}`,
                key: result.id.toString(),
            });
        }
        // --- Crear documento y guardar ---
        const nuevaPublicacion = new publicacion_model_1.modelPublicacion(Object.assign(Object.assign({}, publicacion), { categoria, adjunto: adjuntos, 
            // normalizaciones útiles:
            publicado: `${publicacion.publicado}` === 'true' }));
        const savePost = yield nuevaPublicacion.save();
        res.status(201).json(savePost);
    }
    catch (error) {
        console.error('createPublicacionA error:', error);
        const err = error;
        res.status(500).json({ ok: false, message: err.message });
    }
});
exports.createPublicacionA = createPublicacionA;
// obtener publicaciones por tag
const getPublicacionesByTag = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const { tag, publicado } = req.query;
        const query = {};
        if (tag)
            query.tag = tag;
        if (publicado !== undefined)
            query.publicado = (publicado === 'true');
        const [publicaciones, totalPublicaciones] = yield Promise.all([
            publicacion_model_1.modelPublicacion.find(query)
                .populate('autor', 'nombre')
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit),
            publicacion_model_1.modelPublicacion.countDocuments(query),
        ]);
        // ✅ Nunca 404 por lista vacía. El FE ya maneja array vacío.
        res.status(200).json({
            data: publicaciones,
            pagination: {
                offset,
                limit,
                total: totalPublicaciones,
                pages: Math.ceil(totalPublicaciones / Math.max(limit, 1)),
            },
        });
    }
    catch (error) {
        const err = error;
        res.status(500).json({ message: err.message });
    }
});
exports.getPublicacionesByTag = getPublicacionesByTag;
// Obtener una publicación por su ID
const getPublicacionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const publicacion = yield publicacion_model_1.modelPublicacion.findById(id);
        if (!publicacion) {
            res.status(404).json({ message: 'Publicación no encontrada' });
            return;
        }
        res.status(200).json(publicacion);
    }
    catch (error) {
        const err = error;
        res.status(500).json({ message: err.message });
    }
});
exports.getPublicacionById = getPublicacionById;
// Obtener publicaciones por categoría
const getPublicacionesByCategoria = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { categoriaId } = req.params;
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const query = { categoria: categoriaId, publicado: true };
        const [publicaciones, total] = yield Promise.all([
            publicacion_model_1.modelPublicacion.find(query)
                .populate('autor', 'nombre')
                .populate('categoria', 'nombre')
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit),
            publicacion_model_1.modelPublicacion.countDocuments(query)
        ]);
        res.status(200).json({
            data: publicaciones,
            pagination: {
                offset,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        const err = error;
        res.status(500).json({ message: err.message });
    }
});
exports.getPublicacionesByCategoria = getPublicacionesByCategoria;
// Actualizar una publicación
const updatePublicacion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const publicacion = yield publicacion_model_1.modelPublicacion.findByIdAndUpdate(id, updatedData, { new: true });
        if (!publicacion) {
            res.status(404).json({ message: 'Publicación no encontrada' });
            return;
        }
        res.status(200).json(publicacion);
    }
    catch (error) {
        const err = error;
        res.status(500).json({ message: err.message });
    }
});
exports.updatePublicacion = updatePublicacion;
// Eliminar una publicación (y sus adjuntos en GridFS)
const deletePublicacion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deletedPost = yield publicacion_model_1.modelPublicacion.findByIdAndDelete(id);
        if (!deletedPost) {
            res.status(404).json({ message: 'Publicación no encontrada' });
            return;
        }
        const adjuntos = deletedPost.adjunto;
        if (adjuntos === null || adjuntos === void 0 ? void 0 : adjuntos.length) {
            for (const a of adjuntos) {
                if (a.key) {
                    try {
                        yield (0, gridfs_1.deleteGridFSFile)(a.key);
                    }
                    catch (_a) { }
                }
            }
        }
        res.status(200).json({ message: 'Publicación eliminada correctamente' });
    }
    catch (error) {
        const err = error;
        res.status(500).json({ message: err.message });
    }
});
exports.deletePublicacion = deletePublicacion;
// Agregar comentario
const addComentario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { autor, contenido, fecha } = req.body;
    const nuevoComentario = { autor, contenido, fecha };
    try {
        const publicacionActualizada = yield publicacion_model_1.modelPublicacion.findByIdAndUpdate(id, { $push: { comentarios: nuevoComentario } }, { new: true });
        if (!publicacionActualizada) {
            res.status(404).json({ message: 'Publicación no encontrada' });
            return;
        }
        res.status(201).json(publicacionActualizada);
    }
    catch (error) {
        console.warn('Error al agregar comentario:', error);
        const err = error;
        res.status(500).json({ message: err.message });
    }
});
exports.addComentario = addComentario;
// filtros de búsqueda
const filterPublicaciones = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { texto, tag, autor } = req.query;
        const filtro = {};
        if (texto) {
            filtro.$or = [
                { titulo: { $regex: texto, $options: 'i' } },
                { contenido: { $regex: texto, $options: 'i' } },
            ];
        }
        if (tag)
            filtro.tag = { $regex: tag, $options: 'i' };
        if (autor) {
            if (!mongoose_1.default.Types.ObjectId.isValid(autor)) {
                res.status(400).json({ message: 'ID de autor inválido' });
                return;
            }
            filtro.autor = autor;
        }
        if (Object.keys(filtro).length === 0) {
            res.status(400).json({ message: 'Debe proporcionar al menos un parámetro de búsqueda (titulo, tag o autor)' });
            return;
        }
        const publicaciones = yield publicacion_model_1.modelPublicacion.find(filtro);
        if (publicaciones.length === 0) {
            res.status(404).json({ message: 'No se encontraron publicaciones con esos criterios' });
            return;
        }
        res.status(200).json(publicaciones);
    }
    catch (error) {
        const err = error;
        res.status(500).json({ message: err.message });
    }
});
exports.filterPublicaciones = filterPublicaciones;
