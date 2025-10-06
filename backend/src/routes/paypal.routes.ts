// src/routes/paypal.routes.ts
import { Router } from "express";
import { createOrder, captureOrder } from "../controllers/paypal.controller";

const router = Router();

router.post("/createorder", createOrder);
router.post("/capture/:orderId", captureOrder);

export default router;
