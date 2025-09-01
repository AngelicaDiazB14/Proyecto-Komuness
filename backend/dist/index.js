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
        'http://64.23.137.192'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
//routes
app.use('/api/usuario', usuario_routes_1.default);
app.use('/api/publicaciones', publicaciones_routes_1.default);
app.use('/api/biblioteca', biblioteca_routes_1.default);
app.get('/api/', (req, res) => {
    res.send('Hello World');
});
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
