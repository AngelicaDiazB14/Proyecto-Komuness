"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.deleteFile = exports.uploadFileStorage = exports.uploadFile = void 0;
const AWS = __importStar(require("aws-sdk"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const node_fs_1 = __importDefault(require("node:fs"));
const spacesEndpoint = new AWS.Endpoint(process.env.S3_ENDPOINT);
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    //!TODO: IMPLEMENTAR ESTO QUE HACE FALTA, PARA CUANDO INTEGRE LO DE DIGITAL OCEAN SPACES
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
/**
 * upload file to digitalOcean spaces, a modular function that can be used in any file in this project
 *
 * @param file : Express.Multer.File Archivo a subir al bucket
 * @param folder : string Carpeta donde se va a subir el archivo si es null se subira a la raiz
 * @returns : Promise<string | null> URL del archivo subido de manera publica  o null si ocurre un error
 */
const uploadFile = (file, folder) => __awaiter(void 0, void 0, void 0, function* () {
    // Generar nombre único con timestamp y nombre original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = file.originalname.replace(/\s+/g, '-'); // Reemplazar espacios por guiones
    const uniqueFileName = `${uniqueSuffix}-${originalName}`;
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${folder || 'any'}/${uniqueFileName}`,
        Body: file.buffer,
        ACL: 'public-read',
        ContentType: file.mimetype,
    };
    try {
        const data = yield s3.upload(params).promise();
        return {
            location: data.Location,
            key: data.Key
        };
    }
    catch (error) {
        console.log(error);
        return null;
    }
});
exports.uploadFile = uploadFile;
/**Add commentMore actions
 * upload file to digitalOcean spaces, a modular function that can be used in any file in this project
 *
 * @param file : Express.Multer.File Archivo a subir al bucket
 * @param folder : string Carpeta donde se va a subir el archivo si es null se subira a la raiz
 * @returns : Promise<string | null> URL del archivo subido de manera publica  o null si ocurre un error
 */
const uploadFileStorage = (file, folder) => __awaiter(void 0, void 0, void 0, function* () {
    // Generar nombre único con timestamp y nombre original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = file.originalname.replace(/\s+/g, '-'); // Reemplazar espacios por guiones
    const uniqueFileName = `${uniqueSuffix}-${originalName}`;
    const fileStream = node_fs_1.default.createReadStream(file.path);
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${folder || 'any'}/${uniqueFileName}`,
        Body: fileStream,
        ACL: 'public-read',
        ContentType: file.mimetype,
    };
    try {
        const data = yield s3.upload(params).promise();
        node_fs_1.default.unlinkSync(file.path);
        return {
            location: data.Location,
            key: data.Key
        };
    }
    catch (error) {
        console.log(error);
        return null;
    }
});
exports.uploadFileStorage = uploadFileStorage;
/**
 * deleteFile: delete file from digitalOcean spaces
 *
 * @param key : string Key del archivo a eliminar
 * @returns boolean true si se elimino correctamente, false si ocurre un error
 */
const deleteFile = (key) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        Bucket: process.env.BUCKET_NAME, // Reemplaza con el nombre de tu bucket  process.env.DO_SPACES_BUCKET!,
        Key: key,
    };
    try {
        const result = yield s3.deleteObject(params).promise();
        if (!result.$response.error) {
            return true;
        }
        else {
            console.log('Error deleting file:', result.$response.error);
            return false;
        }
    }
    catch (error) {
        console.log(error);
        return false;
    }
});
exports.deleteFile = deleteFile;
