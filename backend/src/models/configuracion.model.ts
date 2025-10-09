import { IConfiguracion } from "@/interfaces/configuracion.interface";
import { model, Schema } from 'mongoose';

const configuracionSchema = new Schema({
    clave: { type: String, required: true, unique: true },
    valor: { type: Schema.Types.Mixed, required: true },
    descripcion: { type: String, required: false },
    actualizadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: false },
    actualizadoEn: { type: Date, default: Date.now }
}, {
    timestamps: true
});

export const modelConfiguracion = model<IConfiguracion>('Configuracion', configuracionSchema);
