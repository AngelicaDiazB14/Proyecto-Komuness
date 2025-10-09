import { Document } from "mongoose";

export interface IUsuario extends Document {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    tipoUsuario: number; // 0=super-admin, 1=admin, 2=básico, 3=premium
    codigo: string;
    fechaVencimientoPremium?: Date; // Fecha de vencimiento para usuarios premium
    limitePublicaciones?: number; // Límite personalizado de publicaciones (si no se define, usa el global)
}
