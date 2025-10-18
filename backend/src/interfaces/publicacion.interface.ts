import { Document, Types } from "mongoose";

export interface IPublicacion {
  _id?: string;
  titulo: string;
  contenido: string;
  autor: string;                 // ObjectId as string
  fecha: string;
  adjunto?: IAdjunto[];
  comentarios?: IComentario[];
  tag: 'publicacion' | 'evento' | 'emprendimiento';
  publicado: boolean;
  fechaEvento?: string;
  horaEvento?: string;
  precio?: number;
  precioEstudiante?: number;     
  precioCiudadanoOro?: number;   
  enlacesExternos?: IEnlaceExterno[]; 
  telefono?: string;            
  categoria: string;             // ObjectId as string
  createdAt?: string;
  updatedAt?: string;
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

export interface IEnlaceExterno {
    nombre: string;
    url: string;
}