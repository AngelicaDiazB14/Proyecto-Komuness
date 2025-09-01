import { Schema, model } from "mongoose";

const categoriaSchema = new Schema({
    nombre: { type: String, required: true, unique: true }, // Ej: danza, música, teatro
    estado: { type: Boolean, default: true }, // activa o no
}, { timestamps: true });

export const modelCategoria = model("Categoria", categoriaSchema);
