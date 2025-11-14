// src/routes/paypal.routes.ts
import { Router } from "express";
import { captureAndUpgrade, webhook } from "../controllers/paypal.controller";
import { authMiddleware } from "../middlewares/auth.middleware"; // 👈 IMPORTANTE

const router = Router();

// Esta ruta AHORA requiere usuario autenticado
router.post("/capture", authMiddleware, captureAndUpgrade);

// El webhook viene desde PayPal, aquí NO hay usuario logueado de tu app
router.post("/webhook", webhook);

export default router;
