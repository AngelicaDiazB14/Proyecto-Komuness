import { Document, Types } from "mongoose";

export interface IPublicacion {
  _id?: string;
  titulo: string;
  contenido: string;
  autor: string | Types.ObjectId;  
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
  categoria: string | Types.ObjectId;

  // NUEVOS CAMPOS PARA CONTROL DE EDICIONES
  editCount?: number; // Contador de ediciones realizadas
  maxEdits?: number; // Límite máximo de ediciones (3)
  pendingUpdate?: IPublicacionUpdate; // Datos pendientes de aprobación
  lastEditRequest?: string; // Fecha de última solicitud de edición
  editHistory?: IEditHistory[]; // Historial de cambios


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


export interface IPublicacionUpdate {
  titulo?: string;
  contenido?: string;
  fechaEvento?: string;
  horaEvento?: string;
  precio?: number;
  precioEstudiante?: number;
  precioCiudadanoOro?: number;
  enlacesExternos?: IEnlaceExterno[];
  telefono?: string;
  categoria?: string | Types.ObjectId;  // ← Permitir ambos tipos
  adjunto?: IAdjunto[];
  requestedAt: string;
  requestedBy: string;
}

// NUEVA INTERFACE PARA HISTORIAL DE EDICIONES
export interface IEditHistory {
  version: number;
  data: Partial<IPublicacion>;
  editedAt: string;
  editedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  status: 'approved' | 'rejected' | 'pending';
}