import { IPerfil } from "@/interfaces/perfil.interface";
import { model, Schema } from 'mongoose';

const FormacionAcademicaSchema = new Schema({
  institucion: { type: String, required: true },
  titulo: { type: String, required: true },
  añoInicio: { type: Number, required: true },
  añoFin: { type: Number, required: false }
}, { _id: false });

const ExperienciaLaboralSchema = new Schema({
  empresa: { type: String, required: true },
  cargo: { type: String, required: true },
  descripcion: { type: String, required: false },
  añoInicio: { type: Number, required: true },
  añoFin: { type: Number, required: false }
}, { _id: false });

const ProyectoSchema = new Schema({
  nombre: { type: String, required: true },
  url: { type: String, required: true },
  descripcion: { type: String, required: false }
}, { _id: false });

const RedesSocialesSchema = new Schema({
  facebook: { type: String, required: false },
  instagram: { type: String, required: false },
  linkedin: { type: String, required: false },
  twitter: { type: String, required: false }
}, { _id: false });

const perfilSchema = new Schema({
  usuarioId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true,
    unique: true 
  },
  
  // Información personal
  nombre: { type: String, required: false },
  apellidos: { type: String, required: false },
  correoSecundario: { type: String, required: false },
  telefono: { type: String, required: false },
  canton: { type: String, required: false },
  provincia: { type: String, required: false },
  
  // Información profesional
  ocupacionPrincipal: { type: String, required: false },
  titulo: { type: String, required: false },
  especialidad: { type: String, required: false },
  formacionAcademica: { type: [FormacionAcademicaSchema], default: [] },
  experienciaLaboral: { type: [ExperienciaLaboralSchema], default: [] },
  habilidades: { type: [String], default: [] },
  
  // Enlaces
  proyectos: { type: [ProyectoSchema], default: [] },
  urlPortafolio: { type: String, required: false },
  redesSociales: { type: RedesSocialesSchema, default: {} },
  
  // Archivos
  fotoPerfil: { type: String, required: false },
  cvUrl: { type: String, required: false },
  
  // Visibilidad
  enBancoProfesionales: { type: Boolean, default: false },
  perfilPublico: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const modelPerfil = model<IPerfil>('Perfil', perfilSchema);
