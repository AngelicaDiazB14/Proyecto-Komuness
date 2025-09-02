import { Request, Response } from "express";
import { modelCategoria } from "../models/categoria.model"; 


/**
 * Crear categoría
 */
export const createCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      res.status(400).json({ message: "El nombre es obligatorio" });
      return;
    }

    const existe = await modelCategoria.findOne({ nombre: nombre.trim().toLowerCase() });
    if (existe) {
      res.status(400).json({ message: "Ya existe una categoría con ese nombre" });
      return;
    }

    const nuevaCategoria = new modelCategoria({
      nombre: nombre.trim().toLowerCase(),
      estado: true
    });

    const saved = await nuevaCategoria.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear la categoría" });
  }
};

/**
 * Listar categorías (con paginación)
 */
export const getCategorias = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const [categorias, total] = await Promise.all([
      modelCategoria.find({ estado: true }).skip(skip).limit(Number(limit)),
      modelCategoria.countDocuments({ estado: true })
    ]);

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      data: categorias
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las categorías" });
  }
};

/**
 * Obtener categoría por ID
 */
export const getCategoriaById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const categoria = await modelCategoria.findById(id);

    if (!categoria || !categoria.estado) {
      res.status(404).json({ message: "Categoría no encontrada" });
      return;
    }

    res.json(categoria);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener la categoría" });
  }
};

/**
 * Actualizar categoría
 */
export const updateCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    const categoria = await modelCategoria.findById(id);
    if (!categoria || !categoria.estado) {
      res.status(404).json({ message: "Categoría no encontrada" });
      return;
    }

    if (nombre) {
      const existe = await modelCategoria.findOne({
        nombre: nombre.trim().toLowerCase(),
        _id: { $ne: id }
      });
      if (existe) {
        res.status(400).json({ message: "Ya existe una categoría con ese nombre" });
        return;
      }
      categoria.nombre = nombre.trim().toLowerCase();
    }

    const updated = await categoria.save();
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar la categoría" });
  }
};

/**
 * Eliminar categoría (soft delete → estado: false)
 */
export const deleteCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const categoria = await modelCategoria.findById(id);
    if (!categoria || !categoria.estado) {
      res.status(404).json({ message: "Categoría no encontrada" });
      return;
    }

    categoria.estado = false;
    await categoria.save();

    res.json({ message: "Categoría desactivada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar la categoría" });
  }
};
