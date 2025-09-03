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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const categoria_model_1 = require("../models/categoria.model");
dotenv_1.default.config();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mongoose_1.default.connect(process.env.BD_URL);
        console.log('Conectado a MongoDB para pruebas');
        // Crear una categoría de prueba
        const categoria = new categoria_model_1.modelCategoria({ nombre: 'Danza' });
        yield categoria.save();
        console.log('Categoría creada:', categoria);
        // Listar todas las categorías
        const categorias = yield categoria_model_1.modelCategoria.find();
        console.log('Todas las categorías en la base de datos:', categorias);
        // Cerrar conexión
        yield mongoose_1.default.disconnect();
        console.log(' Desconectado de MongoDB');
    });
}
main().catch(console.error);
