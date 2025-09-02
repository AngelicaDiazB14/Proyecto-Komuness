import { Router } from "express";
import {
    createCategoria,
    getCategorias,
    getCategoriaById,
    updateCategoria,
    deleteCategoria
} from "../controllers/categoria.controller";


import { authMiddleware } from "../middlewares/auth.middleware";
import { verificarRoles } from "../middlewares/roles.middleware";

const router = Router();

// Consultar categorías → libre para todos
router.get("/", getCategorias);
router.get("/:id", getCategoriaById);

// Crear, actualizar y eliminar → solo admin (tipoUsuario = 1)
router.post("/", authMiddleware, verificarRoles([1]), createCategoria);
router.put("/:id", authMiddleware, verificarRoles([1]), updateCategoria);
router.delete("/:id", authMiddleware, verificarRoles([1]), deleteCategoria);

export default router;
