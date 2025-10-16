// src/routes/paypal.routes.ts
import { Router } from "express";
import { captureAndUpgrade, webhook } from "../controllers/paypal.controller";

const router = Router();

router.post("/capture", captureAndUpgrade); // opcional: captura por orderId
router.post("/webhook", webhook);           // PayPal enviará POST aquí

export default router;
