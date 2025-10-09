import { Document } from "mongoose";

export interface IConfiguracion extends Document {
    clave: string; // Identificador único de la configuración
    valor: any; // Valor de la configuración (puede ser número, string, objeto, etc.)
    descripcion?: string; // Descripción opcional de qué hace esta configuración
    actualizadoPor?: string; // ID del admin que hizo la última actualización
    actualizadoEn?: Date; // Fecha de última actualización
}
