// src/routes/paypal.routes.ts
import { Router } from "express";
import { captureAndUpgrade, webhook } from "../controllers/paypal.controller";

const router = Router();

router.post("/capture", captureAndUpgrade); 
router.post("/webhook", webhook);           

export default router;
