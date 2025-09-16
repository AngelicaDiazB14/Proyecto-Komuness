import { IComentario, IPublicacion } from "@/interfaces/publicacion.interface";
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
});

//schema publicación
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
    fechaEvento: { type: String, required: false },

    precio: { type: Number, required: false },

    // categorías de área
    categoria: { type: Schema.Types.ObjectId, ref: 'Categoria', required: true }
  },
  { timestamps: true }
);

export const modelPublicacion = model<IPublicacion>('Publicacion', publicacionSchema);
