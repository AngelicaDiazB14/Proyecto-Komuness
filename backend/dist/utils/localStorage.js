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
exports.saveLocalFile = saveLocalFile;
exports.deleteLocalByKey = deleteLocalByKey;
// src/utils/localStorage.ts
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://159.54.148.238';
const BASE_DIR = process.env.BIBLIOTECA_DIR || '/var/komuness/library';
/** Crea el directorio si no existe */
function ensureDir(dir) {
    if (!node_fs_1.default.existsSync(dir))
        node_fs_1.default.mkdirSync(dir, { recursive: true });
}
/**
 * Guarda un archivo de Multer en almacenamiento local permanente
 * @param file Multer.File (diskStorage: tiene .path)
 * @param folderId string | '0' para raíz
 * @returns { location, key }
 */
function saveLocalFile(file, folderId) {
    return __awaiter(this, void 0, void 0, function* () {
        const subdir = folderId && folderId !== '0' ? folderId : 'root';
        const destDir = node_path_1.default.join(BASE_DIR, subdir);
        ensureDir(destDir);
        const safeExt = node_path_1.default.extname(file.originalname) || '';
        const safeBase = node_path_1.default.basename(file.originalname, safeExt).replace(/[^\w\-\.]+/g, '_');
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${safeExt}`;
        const destPath = node_path_1.default.join(destDir, uniqueName);
        // mover del tmp de multer al destino final
        yield node_fs_1.default.promises.rename(file.path, destPath);
        const key = `${subdir}/${uniqueName}`;
        const location = `${PUBLIC_BASE_URL}/biblioteca-files/${key}`;
        return { location, key };
    });
}
/** Borra un archivo por key relativa (subdir/filename) */
function deleteLocalByKey(key) {
    return __awaiter(this, void 0, void 0, function* () {
        const full = node_path_1.default.join(BASE_DIR, key);
        try {
            yield node_fs_1.default.promises.unlink(full);
        }
        catch (_a) {
            // si no existe, ignorar
        }
    });
}
