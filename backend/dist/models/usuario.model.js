"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelUsuario = void 0;
const mongoose_1 = require("mongoose");
const usuarioSchema = new mongoose_1.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    tipoUsuario: { type: Number, required: true },
    codigo: { type: String, required: true },
});
exports.modelUsuario = (0, mongoose_1.model)('Usuario', usuarioSchema);
