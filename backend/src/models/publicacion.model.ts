import { IComentario, IPublicacion, IEnlaceExterno, IEditHistory, IPublicacionUpdate } from "@/interfaces/publicacion.interface";
import { IAdjunto } from "@/interfaces/publicacion.interface";
import { model, Schema } from 'mongoose';

//schema comentario
const comentarioSchema = new Schema<IComentario>({
  autor: { type: String, required: true },
  contenido: { type: String, required: true },
  fecha: { type: String, required: true }
});

//schema adjunto
const adjuntoSchema = new Schema<IAdjunto>({
  url: { type: String, required: true },
  key: { type: String, required: true }
}, { _id: true }); 

const enlaceExternoSchema = new Schema<IEnlaceExterno>({
  nombre: { type: String, required: true },
  url: { type: String, required: true }
});


const publicacionUpdateSchema = new Schema<IPublicacionUpdate>({
  titulo: { type: String, required: false },
  contenido: { type: String, required: false },
  fechaEvento: { type: String, required: false },
  horaEvento: { type: String, required: false },
  precio: { type: Number, required: false },
  precioEstudiante: { type: Number, required: false },
  precioCiudadanoOro: { type: Number, required: false },
  enlacesExternos: { type: [enlaceExternoSchema], required: false },
  telefono: { type: String, required: false },
  categoria: { type: Schema.Types.ObjectId, ref: 'Categoria', required: false },
  adjunto: { type: [adjuntoSchema], required: false },
  requestedAt: { type: String, required: true },
  requestedBy: { type: String, required: true }
}, { _id: false }); // IMPORTANTE: evitar _id duplicados

// Schema para historial de ediciones
const editHistorySchema = new Schema<IEditHistory>({
  version: { type: Number, required: true },
  data: { type: Schema.Types.Mixed, required: true },
  editedAt: { type: String, required: true },
  editedBy: { type: String, required: true },
  approvedBy: { type: String },
  approvedAt: { type: String },
  status: { 
    type: String, 
    enum: ['approved', 'rejected', 'pending'],
    default: 'pending'
  }
});


const publicacionSchema = new Schema(
  {
    titulo: { type: String, required: true },
    contenido: { type: String, required: true },
    // id del autor
    autor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fecha: { type: String, required: true },
    adjunto: { type: [adjuntoSchema], required: false },
    comentarios: { type: [comentarioSchema], required: false },
    tag: { type: String, required: true },
    publicado: { type: Boolean, required: true },

    // Evento
    fechaEvento: { type: String, required: false },
    horaEvento:  { type: String, required: false }, 
    precio: { type: Number, required: false }, // Precio regular
    precioEstudiante: { type: Number, required: false },
    precioCiudadanoOro: { type: Number, required: false }, 
    enlacesExternos: { type: [enlaceExternoSchema], required: false },
    telefono: { type: String, required: false },

    // categorías de área
    categoria: { type: Schema.Types.ObjectId, ref: 'Categoria', required: true },
    
    // CONTROL DE EDICIONES 
    editCount: { 
      type: Number, 
      default: 0,
      min: 0 
    },
    maxEdits: { 
      type: Number, 
      default: 3 
    },
    lastEditRequest: { 
      type: String,
      default: null 
    },
    pendingUpdate: { 
      type: publicacionUpdateSchema,
      default: null 
    },
    editHistory: { 
      type: [editHistorySchema], 
      default: [] 
    }
  },
  { 
    timestamps: true,
    validateBeforeSave: true,
    strict: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

export const modelPublicacion = model<IPublicacion>('Publicacion', publicacionSchema);
