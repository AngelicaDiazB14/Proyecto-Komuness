import { Request, Response } from 'express';
import { Archivo } from '../models/archivo.model';
import { Folder } from '../models/folder.model';
import { IArchivo } from '../interfaces/archivo.interface';
import mongoose from 'mongoose';
import { saveLocalFile, deleteLocalByKey } from '../utils/localStorage';

class BibliotecaController {
  /**
   * Sube archivos a disco local y guarda metadatos
   * POST /api/biblioteca/upload
   */
  static async uploadFiles(req: Request, res: Response) {
    const { folderId, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId es requerido', errors: [] });
    }

    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No se han enviado archivos.', errors: [] });
    }

    try {
      // folder: si viene "0" => raíz => null; si viene válido => ObjectId; si viene vacío => null
      const folderRef =
        folderId && folderId !== '0'
          ? (mongoose.Types.ObjectId.isValid(folderId) ? new mongoose.Types.ObjectId(folderId) : null)
          : null;

      const results = await Promise.all(
        files.map(async (file) => {
          try {
            // Guardar físicamente en disco local permanente
            const stored = await saveLocalFile(file, folderId);

            // Guardar metadatos en Mongo
            const archivo = new Archivo({
              nombre: file.originalname,
              fechaSubida: new Date(),
              tipoArchivo: file.mimetype,
              tamano: file.size,
              autor: userId,
              esPublico: false,
              url: stored.location, // URL pública
              key: stored.key,      // ruta relativa (para borrar)
              folder: folderRef     // null si raíz
            } as Partial<IArchivo>);
            await archivo.save();

            return {
              success: true,
              nombre: file.originalname,
              message: 'Archivo subido correctamente',
              content: archivo
            };
          } catch (error: any) {
            console.error('Error detallado:', error);
            return {
              success: false,
              nombre: file.originalname,
              message: error?.message || 'Error interno al procesar el archivo',
              content: null
            };
          }
        })
      );

      const hasErrors = results.some((r) => !r.success);
      return res.status(hasErrors ? 207 : 200).json({
        success: !hasErrors,
        message: hasErrors
          ? 'Algunos archivos no se subieron correctamente'
          : 'Todos los archivos subidos exitosamente',
        results
      });
    } catch (error: any) {
      console.error('Error general:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error?.message || 'unknown'
      });
    }
  }

  /**
   * GET /api/biblioteca/list/:id
   * id = '0' => raíz
   */
  static async list(req: Request, res: Response) {
    const { id } = req.params;
    const { nombre, global, publico, orden } = req.query;
    const ordenamiento = orden === 'asc' ? 1 : -1;

    if (!id) {
      return res.status(400).json({ success: false, message: 'id es requerido', errors: [] });
    }

    if (!mongoose.Types.ObjectId.isValid(id) && id !== '0') {
      return res.status(400).json({ success: false, message: 'id es inválido', errors: [] });
    }

    // Archivos
    const queryArchivos: any = {
      ...(global !== 'true' && { folder: id !== '0' ? new mongoose.Types.ObjectId(id) : null }),
      ...(nombre && { nombre: { $regex: nombre, $options: 'i' } }),
      ...(publico !== undefined && { esPublico: publico === 'true' })
    };

    // Carpetas
    const queryFolders: any = {
      ...(global !== 'true' && { directorioPadre: id !== '0' ? new mongoose.Types.ObjectId(id) : null }),
      ...(nombre && { nombre: { $regex: nombre, $options: 'i' } })
    };

    try {
      const archivos = await Archivo.find(queryArchivos)
        .populate('autor', 'nombre')
        .collation({ locale: 'es', strength: 2 })
        .sort({ nombre: ordenamiento });

      const folders = await Folder.find(queryFolders)
        .collation({ locale: 'es', strength: 2 })
        .sort({ nombre: ordenamiento });

      return res.status(200).json({ success: true, contentFile: archivos, contentFolder: folders });
    } catch (error: any) {
      console.error('Error general:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error?.message || 'unknown'
      });
    }
  }

  /** POST /api/biblioteca/folder */
  static async createFolder(req: Request, res: Response) {
    const { nombre, parent } = req.body;
    if (!nombre) {
      return res.status(400).json({ success: false, message: 'nombre es requerido', errors: [] });
    }

    try {
      const folder = new Folder({
        nombre,
        fechaCreacion: new Date(),
        directorioPadre:
          parent && parent !== '0'
            ? (mongoose.Types.ObjectId.isValid(parent) ? new mongoose.Types.ObjectId(parent) : null)
            : null
      });
      await folder.save();

      return res.status(200).json({ success: true, message: 'Carpeta creada correctamente', content: folder });
    } catch (error: any) {
      console.error('Error general:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error?.message || 'unknown'
      });
    }
  }

  /** Aux: elimina registro y archivo físico si existe */
  static async deleteFileById(id: string) {
    try {
      const archivo = await Archivo.findById(id);
      if (!archivo) return false;

      // primero borrar archivo físico si hay key
      const key = (archivo as any).key as string | undefined;
      if (key) {
        try { await deleteLocalByKey(key); } catch {}
      }

      await Archivo.findByIdAndDelete(id);
      return true;
    } catch (error) {
      console.error(`Error en deleteFileById:`, error);
      return false;
    }
  }

  /** DELETE /api/biblioteca/delete/:id */
  static async deleteFile(req: Request, res: Response) {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'id es requerido', errors: [] });

    try {
      const archivo = await Archivo.findById(id);
      if (!archivo) {
        return res.status(404).json({ success: false, message: 'Archivo no encontrado', errors: [] });
      }
      await BibliotecaController.deleteFileById(id);
      return res.status(200).json({ success: true, message: 'Archivo eliminado correctamente', content: archivo });
    } catch (error: any) {
      console.error('Error general:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error?.message || 'unknown'
      });
    }
  }

  /** DELETE /api/biblioteca/folder/:id  (y su contenido) */
  static async deleteFolder(req: Request, res: Response) {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'id es requerido', errors: [] });

    try {
      const folder = await Folder.findById(id);
      const archivos: IArchivo[] = await Archivo.find({ folder: id });

      if (!folder) {
        return res.status(404).json({ success: false, message: 'Carpeta no encontrada', errors: [] });
      }

      await Folder.findByIdAndDelete(id);
      for (const archivo of archivos) {
        await BibliotecaController.deleteFileById(archivo._id?.toString() || '');
      }
      return res.status(200).json({ success: true, message: 'Carpeta y archivos eliminados correctamente', content: folder });
    } catch (error: any) {
      console.error('Error general:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error?.message || 'unknown'
      });
    }
  }

  /** GET /api/biblioteca/buscar */
  static async filterArchivo(req: Request, res: Response) {
    try {
      const { texto, tipoArchivo, autor } = req.query;

      const filtro: any = {};
      let carpetasCoincidentes: any[] = [];

      if (texto) {
        filtro.$or = [
          { nombre: { $regex: texto, $options: 'i' } },
          { tipoArchivo: { $regex: texto, $options: 'i' } }
        ];
        carpetasCoincidentes = await Folder.find({ nombre: { $regex: texto as string, $options: 'i' } });
      }

      if (tipoArchivo) filtro.tipoArchivo = { $regex: tipoArchivo, $options: 'i' };

      if (autor) {
        if (!mongoose.Types.ObjectId.isValid(autor as string)) {
          return res.status(400).json({ message: 'ID de autor inválido' });
        }
        filtro.autor = autor;
      }

      if (Object.keys(filtro).length === 0 && !texto) {
        return res.status(400).json({ message: 'Debe proporcionar al menos un parámetro de búsqueda' });
      }

      const archivos = await Archivo.find(filtro).populate('folder');

      if (archivos.length === 0 && carpetasCoincidentes.length === 0) {
        return res.status(404).json({ message: 'No se encontraron resultados con esos criterios' });
      }

      res.status(200).json({ carpetas: carpetasCoincidentes, archivos });
    } catch (error: any) {
      return res.status(500).json({ message: error?.message || 'unknown' });
    }
  }

  /** PUT /api/biblioteca/edit/:id */
  static async updateFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: Partial<IArchivo> = req.body;
      const resultado = await Archivo.findByIdAndUpdate(id, data, { new: true });

      if (!resultado) return res.status(404).json({ message: 'No se pudo editar el archivo' });
      res.status(200).json({ resultado });
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'unknown' });
    }
  }
}
export default BibliotecaController;
