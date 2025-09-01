"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../index")); // Asegúrate de importar la instancia de Express
const publicacion_model_1 = require("../models/publicacion.model");
const mongoose_1 = __importDefault(require("mongoose"));
describe("Comentarios en Publicaciones", () => {
    let publicacionId = null;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Crear una publicación de prueba antes de ejecutar las pruebas
        const publicacion = yield publicacion_model_1.modelPublicacion.create({
            titulo: "Prueba",
            contenido: "Contenido de prueba",
            autor: new mongoose_1.default.Types.ObjectId('67da43f3651480413241b33c'),
            fecha: new Date(),
            adjunto: [],
            comentarios: [],
            tag: "test",
            publicado: true
        });
        publicacionId = publicacion._id.toString();
    }));
    // afterAll(async () => {
    //     await mongoose.connection.close();
    // });
    test("Debe agregar un comentario a la publicación", () => __awaiter(void 0, void 0, void 0, function* () {
        const comentario = {
            autor: "Usuario de prueba",
            contenido: "Este es un comentario de prueba"
        };
        const response = yield (0, supertest_1.default)(index_1.default)
            .post(`/publicaciones/${publicacionId}/comentarios`)
            .send(comentario)
            .expect(201);
        expect(response.body.comentarios).toHaveLength(1);
        expect(response.body.comentarios[0].autor).toBe(comentario.autor);
        expect(response.body.comentarios[0].contenido).toBe(comentario.contenido);
    }));
});
