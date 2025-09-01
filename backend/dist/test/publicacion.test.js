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
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../index"));
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("../utils/mongodb");
(0, globals_1.describe)('Publicacion Endpoints', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, mongodb_1.connectBD)(process.env.BD_URL || 'mongodb://localhost:27017/testdb'); // Conectar a la BD
    }));
    const testPublicacion = {
        titulo: 'Test Publicacion',
        contenido: 'This is a test publication content',
        fecha: new Date(),
        autor: new mongoose_1.default.Types.ObjectId('67da43f3651480413241b33c'),
        tag: 'test',
        adjunto: [],
        comentarios: [],
        publicado: false,
    };
    (0, globals_1.test)('POST /publicaciones - Create new publication', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.default)
            .post('/publicaciones')
            .send(testPublicacion);
        (0, globals_1.expect)(response.status).toBe(201);
        (0, globals_1.expect)(response.body).toHaveProperty('_id');
        const responseDelete = yield (0, supertest_1.default)(index_1.default)
            .delete(`/publicaciones/${response.body._id}`);
        (0, globals_1.expect)(responseDelete.status).toBe(200);
    }));
    (0, globals_1.test)('GET /publicaciones - Get all publications', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.default)
            .get('/publicaciones');
        (0, globals_1.expect)(response.status).toBe(200);
        (0, globals_1.expect)(Array.isArray(response.body)).toBeTruthy();
    }));
    (0, globals_1.test)('GET /publicaciones/:id - Get publication by ID', () => __awaiter(void 0, void 0, void 0, function* () {
        // First create a publication
        const createResponse = yield (0, supertest_1.default)(index_1.default)
            .post('/publicaciones')
            .send(testPublicacion);
        const publicacionId = createResponse.body._id;
        const response = yield (0, supertest_1.default)(index_1.default)
            .get(`/publicaciones/${publicacionId}`);
        (0, globals_1.expect)(response.status).toBe(200);
        (0, globals_1.expect)(response.body.titulo).toBe(testPublicacion.titulo);
        const responseDelete = yield (0, supertest_1.default)(index_1.default)
            .delete(`/publicaciones/${publicacionId}`);
        (0, globals_1.expect)(responseDelete.status).toBe(200);
    }));
    (0, globals_1.test)('PUT /publicaciones/:id - Update publication', () => __awaiter(void 0, void 0, void 0, function* () {
        // First create a publication
        const createResponse = yield (0, supertest_1.default)(index_1.default)
            .post('/publicaciones')
            .send(testPublicacion);
        const publicacionId = createResponse.body._id;
        const updatedData = Object.assign(Object.assign({}, testPublicacion), { titulo: 'Updated Title' });
        const response = yield (0, supertest_1.default)(index_1.default)
            .put(`/publicaciones/${publicacionId}`)
            .send(updatedData);
        (0, globals_1.expect)(response.status).toBe(200);
        (0, globals_1.expect)(response.body.titulo).toBe('Updated Title');
        const responseDelete = yield (0, supertest_1.default)(index_1.default)
            .delete(`/publicaciones/${publicacionId}`);
        (0, globals_1.expect)(responseDelete.status).toBe(200);
    }));
    (0, globals_1.test)('DELETE /publicaciones/:id - Delete publication', () => __awaiter(void 0, void 0, void 0, function* () {
        // First create a publication
        const createResponse = yield (0, supertest_1.default)(index_1.default)
            .post('/publicaciones')
            .send(testPublicacion);
        const publicacionId = createResponse.body._id;
        const response = yield (0, supertest_1.default)(index_1.default)
            .delete(`/publicaciones/${publicacionId}`);
        (0, globals_1.expect)(response.status).toBe(200);
        // Verify the publication was deleted
        const getResponse = yield (0, supertest_1.default)(index_1.default)
            .get(`/publicaciones/${publicacionId}`);
        (0, globals_1.expect)(getResponse.status).toBe(404);
    }));
});
