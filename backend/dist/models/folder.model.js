"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Folder = void 0;
const mongoose_1 = require("mongoose");
const folderSchema = new mongoose_1.Schema({
    nombre: { type: String, required: true },
    fechaCreacion: { type: String, required: true },
    directorioPadre: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Folder', default: null },
});
exports.Folder = (0, mongoose_1.model)('Folder', folderSchema);
