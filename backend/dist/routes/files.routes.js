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
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)();
function getBucket() {
    const db = mongoose_1.default.connection.db;
    if (!db)
        throw new Error('MongoDB no está conectado');
    return new mongoose_1.default.mongo.GridFSBucket(db, { bucketName: 'uploads' });
}
const getFileHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = new mongoose_1.default.Types.ObjectId(req.params.id);
        const bucket = getBucket();
        const files = yield bucket.find({ _id: id }).toArray();
        if (!files || files.length === 0) {
            res.sendStatus(404);
            return;
        }
        const file = files[0];
        if (file.contentType)
            res.setHeader('Content-Type', file.contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Content-Disposition', 'inline');
        const stream = bucket.openDownloadStream(id);
        stream.on('error', () => res.sendStatus(404));
        stream.pipe(res);
    }
    catch (_a) {
        res.sendStatus(400);
    }
});
router.get('/files/:id', getFileHandler);
exports.default = router;
