import { Document, Types } from "mongoose";

export interface IEquipoMiembro {
  nombre: string;
  puesto: string;
  descripcion: string;
  formacion: string[];
  experiencia?: string[];
  proyectosDestacados?: string[];
  reconocimientos?: string[];
  enlaces?: Array<{
    nombre: string;
    url: string;
  }>;
  imagen?: string;
}

export interface ISeccionAcerca extends Document {
  titulo: string;
  contenido: string;
  historia: string;
  mision: string;
  vision: string;
  queHacemos: string;
  motivacion: string;
  impacto: string;
  uneteCausa: string;
  informacionDonaciones: {
    cuentaBancaria: string;
    iban: string;
    nombreCuenta: string;
    cedulaJuridica: string;
    emailFinanzas: string;
    donacionesEspecie: string[];
  };
  contactos: {
    telefono: string;
    email: string;
    facebook?: string;
    instagram?: string;
  };
  equipo: IEquipoMiembro[];
  imagenesProyectos: string[];
  imagenesEquipo: string[];
  estado: boolean;
  createdAt: Date;
  updatedAt: Date;
}