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
exports.filterPublicaciones = exports.addComentario = exports.deletePublicacion = exports.updatePublicacion = exports.getPublicacionById = exports.getPublicacionesByTag = exports.createPublicacionA = exports.createPublicacion = void 0;
const publicacion_model_1 = require("../models/publicacion.model");
const mongoose_1 = __importDefault(require("mongoose"));
const digitalOceanSpace_1 = require("../utils/digitalOceanSpace");
// Crear una publicación
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
//Crear publicación con adjunto v2
const createPublicacionA = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const publicacion = req.body;
        if (!req.files) {
            res.status(400).json({ message: 'No se ha proporcionado un archivo' });
            return;
        }
        //subimos la imagen o imagenes
        let datos = [];
        for (let image of req.files) {
            const result = yield (0, digitalOceanSpace_1.uploadFile)(image, 'publicaciones');
            if (!result) {
                res.status(500).json({ message: 'Error al subir el archivo' });
                return;
            }
            datos.push({
                url: result.location,
                key: result.key
            });
        }
        const nuevaPublicacion = new publicacion_model_1.modelPublicacion(Object.assign(Object.assign({}, publicacion), { adjunto: datos }));
        const savePost = yield nuevaPublicacion.save();
        res.status(201).json(savePost);
    }
    catch (error) {
        const err = error;
        res.status(500).json({ message: err.message });
    }
});
exports.createPublicacionA = createPublicacionA;
//obtener publicaciones por tag
const getPublicacionesByTag = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const { tag, publicado } = req.query;
        // Construye el query de manera flexible
        const query = {};
        if (tag) {
            query.tag = tag;
        }
        if (publicado !== undefined) {
            query.publicado = publicado === 'true';
        }
        const [publicaciones, totalPublicaciones] = yield Promise.all([
            publicacion_model_1.modelPublicacion.find(query)
                .populate('autor', 'nombre')
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit),
            publicacion_model_1.modelPublicacion.countDocuments(query)
        ]);
        if (publicaciones.length === 0) {
            res.status(404).json({ message: 'No se encontraron publicaciones' });
            return;
        }
        res.status(200).json({
            data: publicaciones,
            pagination: {
                offset,
                limit,
                total: totalPublicaciones,
                pages: Math.ceil(totalPublicaciones / limit),
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
// Eliminar una publicación
const deletePublicacion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deletedPost = yield publicacion_model_1.modelPublicacion.findByIdAndDelete(id);
        if (!deletedPost) {
            res.status(404).json({ message: 'Publicación no encontrada' });
            return;
        }
        res.status(200).json({ message: 'Publicación eliminada correctamente' });
    }
    catch (error) {
        const err = error;
        res.status(500).json({ message: err.message });
    }
});
exports.deletePublicacion = deletePublicacion;
/**
 * Agrega comentarios a una publicación
 * @param req : Request de la petición
 * @param res : Response de la petición
 * @returns Código de estado de la petición
 */
const addComentario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; //identificador de la publicación
    const { autor, contenido, fecha } = req.body; //autor y contenido del comentario
    //creado el comentario
    const nuevoComentario = {
        autor,
        contenido,
        fecha,
        // fecha: new Date().toLocaleDateString()
    };
    try {
        const publicacionActualizada = yield publicacion_model_1.modelPublicacion.findByIdAndUpdate(id, { $push: { comentarios: nuevoComentario } }, { new: true }); //agrega el comentario a la publicación
        if (!publicacionActualizada) {
            res.status(404).json({ message: 'Publicación no encontrada' });
            return;
        }
        res.status(201).json(publicacionActualizada);
    }
    catch (error) {
        console.log('Error al agregar comentario:', error);
        const err = error;
        res.status(500).json({ message: err.message });
    }
});
exports.addComentario = addComentario;
// filtros de busqueda
// Obtener publicaciones por titulo, autor o tag (barra de búsqueda)
const filterPublicaciones = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { texto, tag, autor } = req.query;
        const filtro = {};
        //filtro por texto (titulo o contenido)
        if (texto) {
            filtro.$or = [
                { titulo: { $regex: texto, $options: 'i' } },
                { contenido: { $regex: texto, $options: 'i' } }
            ];
        }
        //filtro por tag
        if (tag)
            filtro.tag = { $regex: tag, $options: 'i' };
        //filtro por autor
        if (autor) {
            if (!mongoose_1.default.Types.ObjectId.isValid(autor)) {
                res.status(400).json({ message: 'ID de autor inválido' });
                return;
            }
            filtro.autor = autor; // o: new mongoose.Types.ObjectId(autor as string)
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
