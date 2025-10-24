// src/routes/paypal.routes.ts
import { Router } from "express";
import { captureAndUpgrade, webhook } from "../controllers/paypal.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/capture", authMiddleware, captureAndUpgrade);
router.post("/webhook", webhook);           

export default router;
