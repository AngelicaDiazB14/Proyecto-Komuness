import { Document } from 'mongoose';

export interface FormacionAcademica {
  institucion: string;
  titulo: string;
  añoInicio: number;
  añoFin?: number;
}

export interface ExperienciaLaboral {
  empresa: string;
  cargo: string;
  descripcion?: string;
  añoInicio: number;
  añoFin?: number;
}

export interface Proyecto {
  nombre: string;
  url: string;
  descripcion?: string;
}

export interface RedesSociales {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
}

export interface IPerfil extends Document {
  usuarioId: string;
  // Información personal
  nombre?: string;
  apellidos?: string;
  correoSecundario?: string;
  telefono?: string;
  canton?: string;
  provincia?: string;
  
  // Información profesional
  ocupacionPrincipal?: string;
  titulo?: string;
  especialidad?: string;
  formacionAcademica: FormacionAcademica[];
  experienciaLaboral: ExperienciaLaboral[];
  habilidades: string[];
  
  // Enlaces
  proyectos: Proyecto[];
  urlPortafolio?: string;
  redesSociales: RedesSociales;
  
  // Archivos
  fotoPerfil?: string;
  cvUrl?: string;
  
  // Visibilidad
  enBancoProfesionales: boolean;
  perfilPublico: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}
