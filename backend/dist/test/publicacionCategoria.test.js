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
// src/test/publicacionCategoria.test.ts
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = __importDefault(require("../index"));
const mongodb_1 = require("../utils/mongodb");
(0, globals_1.describe)('Crear Publicación con Categoría', () => {
    (0, globals_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Conectar a la BD de pruebas
        yield (0, mongodb_1.connectBD)(process.env.BD_URL || 'mongodb://localhost:27017/testdb');
    }));
    (0, globals_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Cerrar la conexión
        yield mongoose_1.default.connection.close();
    }));
    const testPublicacion = {
        titulo: 'Publicacion con Categoria',
        contenido: 'Contenido de prueba con categoría',
        fecha: new Date(),
        autor: new mongoose_1.default.Types.ObjectId('67da43f3651480413241b33c'), // reemplazar con autor válido
        tag: 'test',
        adjunto: [],
        comentarios: [],
        publicado: false,
        categoria: new mongoose_1.default.Types.ObjectId('68b5f552cfdb8715f11011dc'), // categoría "Danza"
    };
    (0, globals_1.test)('POST /publicaciones - Crear publicación con categoría', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.default)
            .post('/api/publicaciones')
            .send(testPublicacion);
        (0, globals_1.expect)(response.status).toBe(201);
        (0, globals_1.expect)(response.body).toHaveProperty('_id');
        (0, globals_1.expect)(response.body).toHaveProperty('categoria');
        (0, globals_1.expect)(response.body.categoria).toBe('68b5f552cfdb8715f11011dc');
        // Limpiar: eliminar la publicación creada
        const responseDelete = yield (0, supertest_1.default)(index_1.default)
            .delete(`/api/publicaciones/${response.body._id}`);
    }));
});
