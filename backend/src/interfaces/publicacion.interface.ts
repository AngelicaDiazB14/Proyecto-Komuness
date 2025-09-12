import { Document, Types } from "mongoose";

export interface IPublicacion extends Document {
    titulo: string;
    contenido: string;
    autor: string;
    categoria: Types.ObjectId | ICategoria; 
    fecha: string;
    adjunto: IAdjunto[];
    comentarios: IComentario[]; // Array de comentarios
    tag: string;
    publicado: boolean;
    fechaEvento?: string;
    Precio?: number;
}

export interface ICategoria {
    _id: Types.ObjectId;
    nombre: string;
    estado: boolean;
}

export interface IComentario {
    autor: string;
    contenido: string;
    fecha: string;
}
export interface IAdjunto {
    url: string;
    key: string;
}