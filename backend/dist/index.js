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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongodb_1 = require("./utils/mongodb");
const usuario_routes_1 = __importDefault(require("./routes/usuario.routes"));
const publicaciones_routes_1 = __importDefault(require("./routes/publicaciones.routes"));
const biblioteca_routes_1 = __importDefault(require("./routes/biblioteca.routes"));
const categoria_routes_1 = __importDefault(require("./routes/categoria.routes")); //importación de rutas para categoría
const files_routes_1 = __importDefault(require("./routes/files.routes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
dotenv_1.default.config();
app.disable('x-powered-by');
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3001',
        'http://localhost:3000',
        'https://proyecto-komuness-front.vercel.app',
        'https://komuness-project.netlify.app',
        'http://64.23.137.192',
        'http://159.54.148.238'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
//routes
app.use('/api/usuario', usuario_routes_1.default);
app.use('/api/publicaciones', publicaciones_routes_1.default);
app.use('/api/biblioteca', biblioteca_routes_1.default);
app.use("/api/categorias", categoria_routes_1.default); // nueva ruta para categorías
app.use('/api', files_routes_1.default);
app.get('/api/', (req, res) => {
    res.send('Hello World');
});
// Middleware para detectar errores de payload (p.ej. 413 Payload Too Large) y errores de subida
const globalErrorHandler = (err, _req, res, _next) => {
    // Multer file too large
    if (err && (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_PART_COUNT' || err.code === 'LIMIT_FILE_COUNT')) {
        res.status(413).json({
            success: false,
            message: `El archivo excede el límite permitido de ${(process.env.LIBRARY_MAX_FILE_SIZE_MB || '200')} MB.`,
            errorCode: err.code || 'LIMIT_EXCEEDED'
        });
        return;
    }
    // 413 generic
    if (err && err.status === 413) {
        res.status(413).json({
            success: false,
            message: `Payload demasiado grande. Asegúrate que los archivos no superen ${(process.env.LIBRARY_MAX_FILE_SIZE_MB || '200')} MB.`,
        });
        return;
    }
    // errores de conexión comunes al subir archivos
    if (err && (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT')) {
        res.status(502).json({
            success: false,
            message: 'Hubo un problema de conexión durante la carga. Intenta nuevamente.',
            errorCode: err.code
        });
        return;
    }
    // si no es un error controlado, no lo transformamos aquí (dejamos que otros middlewares lo manejen)
    if (err) {
        console.error('Unhandled error middleware:', err);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
        return;
    }
    return;
};
app.use(globalErrorHandler);
const port = process.env.PORT || 5000;
// Conexión a MongoDB y exportación
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, mongodb_1.connectBD)(process.env.BD_URL);
    console.log("✅ MongoDB conectado");
}))();
exports.default = app;
// esto es para que no se ejecute el server al importarlo en otro archivo
if (require.main === module) {
    (0, mongodb_1.connectBD)(process.env.BD_URL || '').then(() => {
        console.log('Connected to MongoDB');
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    });
}
