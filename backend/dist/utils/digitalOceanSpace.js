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
exports.uploadFile = uploadFile;
exports.uploadFileStorage = uploadFileStorage;
// src/utils/digitalOceanSpace.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/srv/uploads';
const BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost';
function safeName(original) {
    return `${Date.now()}-${original.replace(/\s+/g, '_')}`;
}
function writeToDisk(buf, relKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const fullPath = path_1.default.join(UPLOAD_DIR, relKey);
        yield fs_1.default.promises.mkdir(path_1.default.dirname(fullPath), { recursive: true });
        yield fs_1.default.promises.writeFile(fullPath, buf);
        return {
            location: `${BASE_URL}/uploads/${relKey}`,
            key: relKey
        };
    });
}
/** Sube un archivo (buffer o path) y devuelve { location, key } */
function uploadFile(file_1) {
    return __awaiter(this, arguments, void 0, function* (file, prefix = '') {
        const name = (prefix ? `${prefix}/` : '') + safeName(file.originalname || 'file');
        const buffer = file.buffer || (file.path ? yield fs_1.default.promises.readFile(file.path) : null);
        if (!buffer)
            throw new Error('No file buffer/path provided');
        return writeToDisk(buffer, name);
    });
}
/** Compat con tu controlador de biblioteca */
function uploadFileStorage(file_1) {
    return __awaiter(this, arguments, void 0, function* (file, folderId = '') {
        const name = (folderId ? `${folderId}/` : '') + safeName(file.originalname || 'file');
        const buffer = file.buffer || (file.path ? yield fs_1.default.promises.readFile(file.path) : null);
        if (!buffer)
            throw new Error('No file buffer/path provided');
        return writeToDisk(buffer, name);
    });
}
exports.default = { uploadFile, uploadFileStorage };
