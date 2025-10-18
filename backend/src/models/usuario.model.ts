import { IUsuario } from "@/interfaces/usuario.interface";
import { model, Schema } from 'mongoose';

const usuarioSchema = new Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    tipoUsuario: { type: Number, required: true }, // 0=super-admin, 1=admin, 2=básico, 3=premium
    codigo: { type: String, required: true },
    fechaVencimientoPremium: { type: Date, required: false }, // Fecha de vencimiento para usuarios premium
    limitePublicaciones: { type: Number, required: false }, // Límite personalizado (opcional)
});

export const modelUsuario = model<IUsuario>('Usuario', usuarioSchema);