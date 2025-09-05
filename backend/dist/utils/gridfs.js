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
exports.saveBufferToGridFS = saveBufferToGridFS;
exports.uploadBufferToGridFS = saveBufferToGridFS;
exports.saveMulterFileToGridFS = saveMulterFileToGridFS;
exports.deleteGridFSFile = deleteGridFSFile;
const mongoose_1 = __importDefault(require("mongoose"));
let bucket = null;
function getBucket() {
    if (!bucket) {
        const db = mongoose_1.default.connection.db;
        if (!db)
            throw new Error('MongoDB no está conectado');
        bucket = new mongoose_1.default.mongo.GridFSBucket(db, { bucketName: 'uploads' });
    }
    return bucket;
}
/**
 * Guarda un Buffer en GridFS
 */
// en src/utils/gridfs.ts
function saveBufferToGridFS(buffer, filename, mimetype) {
    return new Promise((resolve, reject) => {
        const bkt = getBucket(); // <- usar getBucket()
        const uploadStream = bkt.openUploadStream(filename, { contentType: mimetype });
        uploadStream.once('error', reject);
        uploadStream.once('finish', () => {
            resolve({ id: uploadStream.id, filename: uploadStream.filename });
        });
        uploadStream.end(buffer);
    });
}
/**
 * Guarda un archivo de Multer en GridFS
 */
function saveMulterFileToGridFS(file, prefix) {
    const safeName = (prefix ? `${prefix}/` : '') + `${Date.now()}_${file.originalname}`;
    return saveBufferToGridFS(file.buffer, safeName, file.mimetype);
}
/**
 * Borra un archivo por id en GridFS
 */
function deleteGridFSFile(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const bkt = getBucket();
        yield bkt.delete(new mongoose_1.default.Types.ObjectId(id));
    });
}
