// src/models/Payment.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  eventId?: string;
  orderId?: string;
  captureId?: string;
  userId?: mongoose.Types.ObjectId;
  status: string;
  value?: string;
  currency?: string;
  payerId?: string;
  email?: string;
  raw: any;
}

const PaymentSchema = new Schema<IPayment>(
  {
    eventId:   { type: String, index: true, unique: true, sparse: true },
    orderId:   { type: String, index: true,  sparse: true },
    captureId: { type: String, index: true, unique: true, sparse: true },
    userId:    { type: Schema.Types.ObjectId, ref: "Usuario" },
    status:    { type: String, required: true },
    value:     String,
    currency:  String,
    payerId:   String,
    email:     String,
    raw:       Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
