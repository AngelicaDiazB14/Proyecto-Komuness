import { Schema, model } from "mongoose";

export interface ICategoria {
  nombre: string;
  estado: boolean;
}

const categoriaSchema = new Schema<ICategoria>({
  nombre: { type: String, required: true, unique: true },
  estado: { type: Boolean, default: true },
}, { timestamps: true });

export const modelCategoria = model<ICategoria>("Categoria", categoriaSchema);
