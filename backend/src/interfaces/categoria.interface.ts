import { Document } from "mongoose";

export interface ICategoria extends Document {
    nombre: string;       // Ej: danza, música, teatro
    estado: boolean;      // activa o inactiva
    createdAt: Date;      // generado automáticamente por timestamps
    updatedAt: Date;      // generado automáticamente por timestamps
}
