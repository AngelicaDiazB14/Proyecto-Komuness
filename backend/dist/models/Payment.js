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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
// src/models/Payment.ts
const mongoose_1 = __importStar(require("mongoose"));
const PaymentSchema = new mongoose_1.Schema({
    eventId: { type: String, index: true, unique: true, sparse: true },
    orderId: { type: String, index: true, sparse: true },
    captureId: { type: String, index: true, unique: true, sparse: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Usuario" },
    status: { type: String, required: true },
    value: String,
    currency: String,
    payerId: String,
    email: String,
    raw: mongoose_1.Schema.Types.Mixed,
    attemptNumber: { type: Number, default: 1 },
    lastError: { type: String },
    retryHistory: [{
            timestamp: { type: Date, required: true },
            attemptNumber: { type: Number, required: true },
            errorCode: { type: String, required: true },
            errorMessage: { type: String, required: true },
            statusCode: { type: Number },
        }],
}, { timestamps: true });
exports.Payment = mongoose_1.default.model("Payment", PaymentSchema);
