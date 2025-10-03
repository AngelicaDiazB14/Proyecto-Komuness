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
exports.getEventosPorFecha = exports.filterPublicaciones = exports.addComentario = exports.deletePublicacion = exports.updatePublicacion = exports.getPublicacionesByCategoria = exports.getPublicacionById = exports.getPublicacionesByTag = exports.createPublicacionA = exports.createPublicacion = void 0;
const publicacion_model_1 = require("../models/publicacion.model");
const mongoose_1 = __importDefault(require("mongoose"));
const gridfs_1 = require("../utils/gridfs");
const LOG_ON = process.env.LOG_PUBLICACION === '1';
// Utilidad: normaliza precio (string → number | undefined)
function parsePrecio(input) {
    if (input === undefined || input === null)
        return undefined;
    if (typeof input === 'number' && Number.isFinite(input))
        return input;
    if (typeof input === 'string') {
        const trimmed = input.trim();
        if (!trimmed)
            return undefined;
        // elimina símbolos comunes y separadores de miles
        const cleaned = trimmed.replace(/[₡$,]/g, '');
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
}
function mustRequirePrecio(tag) {
    return tag === 'evento' || tag === 'emprendimiento';
}
// NUEVO: normaliza hora del evento en formato HH:mm (24h). Si no cumple, se ignora.
function parseHoraEvento(input) {
    if (typeof input !== 'string')
        return undefined;
    const t = input.trim();
    // acepta "HH:mm"
    return /^\d{2}:\d{2}$/.test(t) ? t : undefined;
}
// Crear una publicación (sin adjuntos)
const createPublicacion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const precio = parsePrecio(body.precio);
        const tag = body.tag;
        const horaEvento = parseHoraEvento(body.horaEvento); // ← NUEVO
        if (LOG_ON) {
            console.log('[Publicaciones][createPublicacion] req.body.precio:', body.precio, '→ normalizado:', precio);
            console.log('[Publicaciones][createPublicacion] req.body.horaEvento:', body.horaEvento, '→ normalizado:', horaEvento);
            console.log('[Publicaciones][createPublicacion] tag:', tag);
        }
        if (mustRequirePrecio(tag) && (precio === undefined)) {
            res.status(400).json({ message: 'El campo precio es obligatorio y debe ser numérico para eventos/emprendimientos.' });
            return;
        }
        const publicacion = Object.assign(Object.assign({}, body), { publicado: `${body.publicado}` === 'true', precio, // ← ya normalizado
            horaEvento });
        const nuevaPublicacion = new publicacion_model_1.modelPublicacion(publicacion);
        if (LOG_ON) {
            console.log('[Publicaciones][createPublicacion] doc a guardar (precio, horaEvento):', {
                precio: nuevaPublicacion.precio,
                horaEvento: nuevaPublicacion.horaEvento,
            });
        }
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
        // --- Precio (existente) ---
        const precio = parsePrecio(publicacion.precio);
        const tag = publicacion.tag;
        // --- Hora del evento (NUEVO) ---
        const horaEvento = parseHoraEvento(publicacion.horaEvento);
        if (LOG_ON) {
            console.log('[Publicaciones][createPublicacionA] body.precio:', publicacion.precio, '→', precio);
            console.log('[Publicaciones][createPublicacionA] body.horaEvento:', publicacion.horaEvento, '→', horaEvento);
            console.log('[Publicaciones][createPublicacionA] tag:', tag);
        }
        if (mustRequirePrecio(tag) && (precio === undefined)) {
            res.status(400).json({ ok: false, message: 'El campo precio es obligatorio y debe ser numérico para eventos/emprendimientos.' });
            return;
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
            publicado: `${publicacion.publicado}` === 'true', precio, // ← ya normalizado
            horaEvento }));
        if (LOG_ON) {
            console.log('[Publicaciones][createPublicacionA] doc a guardar (precio, horaEvento):', {
                precio: nuevaPublicacion.precio,
                horaEvento: nuevaPublicacion.horaEvento,
            });
        }
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
        const { tag, publicado, categoria } = req.query;
        const query = {};
        if (tag)
            query.tag = tag;
        if (publicado !== undefined)
            query.publicado = (publicado === 'true');
        if (categoria) {
            query.categoria = categoria;
        }
        const [publicaciones, totalPublicaciones] = yield Promise.all([
            publicacion_model_1.modelPublicacion.find(query)
                .populate('autor', 'nombre')
                .populate('categoria', 'nombre estado')
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit),
            publicacion_model_1.modelPublicacion.countDocuments(query),
        ]);
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
        const publicacion = yield publicacion_model_1.modelPublicacion.findById(id)
            .populate('autor', 'nombre')
            .populate('categoria', 'nombre estado');
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
                .populate('categoria', 'nombre estado')
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
        const updatedData = Object.assign({}, req.body);
        if (updatedData.hasOwnProperty('precio')) {
            const parsed = parsePrecio(updatedData.precio);
            if (LOG_ON) {
                console.log('[Publicaciones][updatePublicacion] body.precio:', updatedData.precio, '→ normalizado:', parsed);
            }
            updatedData.precio = parsed;
        }
        // NUEVO: si viene horaEvento, normalizar a HH:mm (si no es válida, se quita del update para no pisar nada)
        if (updatedData.hasOwnProperty('horaEvento')) {
            const parsedHora = parseHoraEvento(updatedData.horaEvento);
            if (LOG_ON) {
                console.log('[Publicaciones][updatePublicacion] body.horaEvento:', updatedData.horaEvento, '→ normalizado:', parsedHora);
            }
            if (parsedHora !== undefined) {
                updatedData.horaEvento = parsedHora;
            }
            else {
                delete updatedData.horaEvento;
            }
        }
        // Si cambia tag a evento/emprendimiento y no trae precio válido:
        if (mustRequirePrecio(updatedData.tag) && (updatedData.precio === undefined)) {
            res.status(400).json({ message: 'El campo precio es obligatorio y debe ser numérico para eventos/emprendimientos.' });
            return;
        }
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
// Obtener eventos por rango de fechas
const getEventosPorFecha = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            res.status(400).json({ message: 'Se requieren startDate y endDate' });
            return;
        }
        const eventos = yield publicacion_model_1.modelPublicacion.find({
            tag: 'evento',
            publicado: true,
            fechaEvento: {
                $gte: startDate,
                $lte: endDate
            }
        })
            .populate('autor', 'nombre')
            .populate('categoria', 'nombre')
            // incluye horaEvento y precio
            .select('titulo fechaEvento horaEvento contenido adjunto _id precio')
            .sort({ fechaEvento: 1 });
        res.status(200).json(eventos);
    }
    catch (error) {
        const err = error;
        res.status(500).json({ message: err.message });
    }
});
exports.getEventosPorFecha = getEventosPorFecha;
