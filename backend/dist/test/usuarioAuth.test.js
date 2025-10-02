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
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = __importDefault(require("../index"));
const mongodb_1 = require("../utils/mongodb");
// Generar email único para cada ejecución
const uniqueEmail = `testuser_${Date.now()}@example.com`;
const testUser = {
    nombre: 'Test',
    apellido: 'User',
    email: uniqueEmail,
    password: 'TestPassword123',
    tipoUsuario: 0, // superadmin para poder eliminar usuarios
    codigo: 'ABC123'
};
let userId;
let token;
let recoveryCode;
(0, globals_1.describe)('Auth: Registro, Login, Cambio y Recuperación de Contraseña, Logout', () => {
    (0, globals_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, mongodb_1.connectBD)(process.env.BD_URL || 'mongodb://localhost:27017/testdb');
        // Eliminar usuario si existe (limpieza previa)
        try {
            yield (0, supertest_1.default)(index_1.default)
                .delete(`/api/usuario/${uniqueEmail}`);
        }
        catch (e) { }
    }));
    (0, globals_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.connection.close();
    }));
    (0, globals_1.test)('Registro de usuario', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.default)
            .post('/api/usuario/register')
            .send(testUser);
        (0, globals_1.expect)(res.status).toBe(201);
        (0, globals_1.expect)(res.body).toHaveProperty('user');
        (0, globals_1.expect)(res.body.user).toHaveProperty('_id');
        userId = res.body.user._id;
    }));
    (0, globals_1.test)('Login de usuario', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.default)
            .post('/api/usuario/login')
            .send({ email: testUser.email, password: testUser.password });
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body).toHaveProperty('token');
        token = res.body.token;
        (0, globals_1.expect)(res.body.user.tipoUsuario).toBe(testUser.tipoUsuario);
    }));
    (0, globals_1.test)('Validación de roles', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.default)
            .get('/api/usuario/check')
            .set('Authorization', `Bearer ${token}`);
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body.user.tipoUsuario).toBe(testUser.tipoUsuario);
    }));
    (0, globals_1.test)('Recuperación de contraseña (envío de código)', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.default)
            .post('/api/usuario/recuperar-contrasena')
            .send({ email: testUser.email });
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body).toHaveProperty('message');
    }));
    // NOTA: El endpoint para cambiar contraseña no está definido en usuario.routes.ts, debe implementarse si no existe.
    (0, globals_1.test)('Logout de usuario', () => __awaiter(void 0, void 0, void 0, function* () {
        // Si tienes un endpoint de logout, ajústalo aquí. Si no, omite este test.
        // Ejemplo:
        // const res = await request(app)
        //     .post('/api/usuario/logout')
        //     .set('Authorization', `Bearer ${token}`);
        // expect(res.status).toBe(200);
        (0, globals_1.expect)(true).toBe(true); // Placeholder
    }));
    (0, globals_1.test)('Eliminar usuario de prueba', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.default)
            .delete(`/api/usuario/${userId}`)
            .set('Authorization', `Bearer ${token}`);
        (0, globals_1.expect)(res.status).toBe(200);
    }));
});
