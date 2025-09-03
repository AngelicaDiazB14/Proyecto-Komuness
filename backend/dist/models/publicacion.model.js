"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelPublicacion = void 0;
const mongoose_1 = require("mongoose");
//schema comentario
const comentarioSchema = new mongoose_1.Schema({
    autor: { type: String, required: true },
    contenido: { type: String, required: true },
    fecha: { type: String, required: true }
});
//schema adjunto
const adjuntoSchema = new mongoose_1.Schema({
    url: { type: String, required: true },
    key: { type: String, required: true }
});
//schema publicación
const publicacionSchema = new mongoose_1.Schema({
    titulo: { type: String, required: true },
    contenido: { type: String, required: true },
    //id del autor
    autor: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fecha: { type: String, required: true },
    adjunto: { type: [adjuntoSchema], required: false },
    comentarios: { type: [comentarioSchema], required: false },
    tag: { type: String, required: true },
    publicado: { type: Boolean, required: true },
    fechaEvento: { type: String, required: false },
    Precio: { type: Number, required: false },
    // categorías de área
    categoria: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Categoria', required: true }
}, { timestamps: true });
exports.modelPublicacion = (0, mongoose_1.model)('Publicacion', publicacionSchema);
