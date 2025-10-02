"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelCategoria = void 0;
const mongoose_1 = require("mongoose");
const categoriaSchema = new mongoose_1.Schema({
    nombre: { type: String, required: true, unique: true },
    estado: { type: Boolean, default: true },
}, {
    timestamps: true
});
exports.modelCategoria = (0, mongoose_1.model)("Categoria", categoriaSchema);
