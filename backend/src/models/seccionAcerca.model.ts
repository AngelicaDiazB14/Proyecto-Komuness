import { Schema, model, Document, Types } from "mongoose";
import { ISeccionAcerca, IEquipoMiembro } from "../interfaces/seccionAcerca.interface";

const equipoMiembroSchema = new Schema<IEquipoMiembro>({
  nombre: { type: String, required: true },
  puesto: { type: String, required: true },
  descripcion: { type: String, required: true },
  formacion: [{ type: String }],
  experiencia: [{ type: String }],
  proyectosDestacados: [{ type: String }],
  reconocimientos: [{ type: String }],
  enlaces: [{
    nombre: String,
    url: String
  }],
  imagen: { type: String }
});

const seccionAcercaSchema = new Schema<ISeccionAcerca>({
  titulo: { type: String, required: true, default: "COOPESINERGIA R.L. - Tejiendo Futuro en Comunidad" },
  contenido: { type: String, required: true },
  historia: { type: String, required: true },
  mision: { type: String, required: true },
  vision: { type: String, required: true },
  queHacemos: { type: String, required: true },
  motivacion: { type: String, required: true },
  impacto: { type: String, required: true },
  uneteCausa: { type: String, required: true },
  informacionDonaciones: {
    cuentaBancaria: { type: String, default: "0005964154" },
    iban: { type: String, default: "CR86016111084159641540" },
    nombreCuenta: { type: String, default: "Coopesinergia" },
    cedulaJuridica: { type: String, default: "3-002-639930" },
    emailFinanzas: { type: String, default: "coopesinergiafinanzas@gmail.com" },
    donacionesEspecie: [{ type: String }]
  },
  contactos: {
    telefono: { type: String, required: true, default: "85690514" },
    email: { type: String, required: true, default: "komunesscr@gmail.com" },
    facebook: { type: String, default: "https://www.facebook.com/komuness" },
    instagram: { type: String, default: "https://www.instagram.com/komunesscr/" }
  },
  equipo: [equipoMiembroSchema],
  imagenesProyectos: [{ type: String }],
  imagenesEquipo: [{ type: String }],
  estado: { type: Boolean, default: true }
}, { 
  timestamps: true 
});

export const modelSeccionAcerca = model<ISeccionAcerca>("SeccionAcerca", seccionAcercaSchema);