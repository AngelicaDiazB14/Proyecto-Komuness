import { Request, Response } from 'express';
import { Archivo } from '../models/archivo.model';
import { Folder } from '../models/folder.model';
// import { uploadFile } from '../utils/digitalOceanSpace';
// import { uploadFileStorage } from '../utils/digitalOceanSpace';
import { IArchivo } from '../interfaces/archivo.interface';
import mongoose from 'mongoose';

/* ====================== NUEVO: dependencias para guardar en disco ====================== */
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import multer from 'multer';

/**
 * Carpeta base para los binarios de la BIBLIOTECA en la VM.
 * - Si existe LIBRARY_DIR en el .env, se usa esa.
 * - Si no, se crea/usa /srv/uploads/biblioteca (derivado de UPLOAD_DIR si está definido).
 */
const LIB_DIR =
  process.env.LIBRARY_DIR ||
  path.join(process.env.UPLOAD_DIR || '/srv/uploads', 'biblioteca');

/** Asegura subcarpeta por año/mes (ej: /srv/uploads/biblioteca/2025/09) */
async function ensureDestDir(): Promise<string> {
  const now = new Date();
  const dir = path.join(
    LIB_DIR,
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, '0')
  );
  await fsp.mkdir(dir, { recursive: true });
  return dir;
}

/** Sanitiza el nombre del archivo */
function sanitizeName(name: string) {
  return name.replace(/[^\w.\- ]+/g, '_');
}

/**
 * Multer especializado para Biblioteca:
 * - Guarda en disco (no en memoria)
 * - Respeta la estructura por fecha
 */
export const uploadLibrary = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, cb) => {
      try {
        const dir = await ensureDestDir();
        cb(null, dir);
      } catch (err) {
        cb(err as any, LIB_DIR);
      }
    },
    filename: (_req, file, cb) => {
      const safe = sanitizeName(file.originalname);
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});
/* ====================== FIN NUEVO ====================== */

class BibliotecaController {
    /**
     * @description: Sube los archivos a la biblioteca ~en digitalOcean spaces~ **(AHORA EN DISCO LOCAL DE LA VM)** y guarda los metadatos en la base de datos
     * @route: POST /api/biblioteca/upload
     * @param req: Request
     * @param res: Response
     * @returns: Response 
     */
    static async uploadFiles(req: Request, res: Response) {

        const { folderId, userId } = req.body;
        console.log(folderId, userId);
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId es requerido',
                errors: []
            });
        }

        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se han enviado archivos.',
                errors: []
            });
        }

        try {

            const results = await Promise.all(files.map(async (file) => {

                try {
                    /* ===========================================================
                     * NUEVO: Guardado en disco ya lo realizó Multer (file.path)
                     * - Calculamos una "key" RELATIVA a LIB_DIR para guardarla en Atlas.
                     * - Luego generamos una URL de descarga servida por el backend.
                     * =========================================================== */
                    const relKey = path
                      .relative(LIB_DIR, file.path)
                      .split(path.sep)
                      .join('/');


                    // dentro del try de cada file en uploadFiles
                    const folderValue =
                        !folderId || folderId === '0' ? null : new mongoose.Types.ObjectId(folderId);
                    const autorValue = new mongoose.Types.ObjectId(userId);

                    // 1) Instancia (Mongoose ya asigna _id antes de guardar)
                    const archivo = new Archivo({
                        nombre: file.originalname,
                        fechaSubida: new Date(),
                        tipoArchivo: file.mimetype,
                        tamano: file.size,
                        autor: autorValue,
                        esPublico: true,              // <--- ÚNICO CAMBIO: todo queda publicado
                        key: relKey,
                        folder: folderValue,
                    });

                    // 2) Asigna la URL usando el _id generado y guarda una sola vez
                    archivo.url = `${process.env.PUBLIC_BASE_URL || 'http://159.54.148.238'}/api/biblioteca/files/${archivo._id}`;
                    await archivo.save();

                    return {
                        success: true,
                        nombre: file.originalname,
                        message: 'Archivo subido correctamente',
                        content: archivo
                    };

                } catch (error) {
                    console.error('Error detallado:', error); // Mejor logging
                    return {
                        success: false,
                        nombre: file.originalname,
                        message: error instanceof Error ? error.message : 'Error interno al procesar el archivo',
                        content: null
                    };
                }
            }));
            // Verificar si hay errores en alguna de las respuestas
            const hasErrors = results.some(r => !r.success);
            // Respuesta final al cliente
            return res.status(hasErrors ? 207 : 200).json({
                success: !hasErrors,
                message: hasErrors ? 'Algunos archivos no se subieron correctamente' : 'Todos los archivos subidos exitosamente',
                results
            });

        } catch (error) {
            console.error('Error general:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
    }

    /**
     * @description: Lista el contenido de una carpeta de la biblioteca (archivos y carpetas) 
     * @route: GET /api/biblioteca/list/:id
     * si su id es 0, entonces se listan los archivos y carpetas de la raiz
     * de lo contrario, se listan los archivos y carpetas de la carpeta con el id especificado
     * @param req: Request
     * @param res: Response
     * @returns: Response
     */
    static async list(req: Request, res: Response) {
        const { id } = req.params;
        const { nombre, global, publico, orden } = req.query;
        const ordenamiento = orden === 'asc' ? 1 : -1;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'id es requerido',
                errors: []
            });
        }
        // generar el objectid basado en el id del param
        //no validar si no generarlo
        if (!mongoose.Types.ObjectId.isValid(id) && id !== '0') {
            return res.status(400).json({
                success: false,
                message: 'id es inválido',
                errors: []
            });
        }

        // Modificar en la construcción de queryArchivos
        const queryArchivos = {
            ...(global !== 'true' && {
                folder: id !== '0' ? new mongoose.Types.ObjectId(id) : null
            }),
            ...(nombre && { nombre: { $regex: nombre, $options: 'i' } }),
            ...(publico !== undefined && { esPublico: publico === 'true' })
        };

        // Y en queryFolders
        const queryFolders = {
            ...(global !== 'true' && {
                directorioPadre: id !== '0' ? new mongoose.Types.ObjectId(id) : null
            }),
            ...(nombre && { nombre: { $regex: nombre, $options: 'i' } })
        };

        try {
            console.log('Query archivos:', queryArchivos);
            console.log('Query folders:', queryFolders);

            const archivos = await Archivo.find(queryArchivos)
                .populate('autor', 'nombre')
                .collation({ locale: 'es', strength: 2 })
                .sort({ nombre: ordenamiento });
            const folders = await Folder.find(queryFolders)
                .collation({ locale: 'es', strength: 2 })
                .sort({ nombre: ordenamiento });

            return res.status(200).json({
                success: true,
                contentFile: archivos,
                contentFolder: folders
            });
        } catch (error) {
            console.error('Error general:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
    }

    /**
     * @description: Crea una carpeta en la biblioteca
     * @route: POST /api/biblioteca/folder
     * @param req: Request
     * @param res: Response
     * @returns: Response
     */
    static async createFolder(req: Request, res: Response) {
        const { nombre, parent } = req.body;

        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'nombre es requerido',
                errors: []
            });
        }

        try {
            const folder = new Folder({
                nombre,
                fechaCreacion: new Date(),
                directorioPadre: parent === '0' ? null : parent
            });
            await folder.save();

            return res.status(200).json({
                success: true,
                message: 'Carpeta creada correctamente',
                content: folder
            })
        } catch (error) {
            console.error('Error general:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
    }
    /**
     * Función para eliminar un archivo de la biblioteca (modular, debido a que hay 2 funciones que la llaman)
     * @param id
     * @returns boolean
     */
    static async deleteFileById(id: string) {
        try {
            const archivo = await Archivo.findById(id);

            if (!archivo)
                return false;

            /* ====================== NUEVO: eliminar también del disco ====================== */
            try {
              if (archivo.key) {
                const abs = path.resolve(LIB_DIR, archivo.key);
                const libNorm = path.normalize(LIB_DIR + path.sep);
                const absNorm = path.normalize(abs);
                if (absNorm.startsWith(libNorm) && fs.existsSync(absNorm)) {
                  await fsp.unlink(absNorm);
                }
              }
            } catch (e) {
              console.warn('No se pudo eliminar el binario en disco:', e);
            }
            /* ====================== FIN NUEVO ====================== */

            // Eliminar el archivo de la biblioteca (documento en Atlas)
            await Archivo.findByIdAndDelete(id);

            return true;
        } catch (error) {
            console.error(`Error en la función: ${this.constructor.name}\n Error general:${error}`);
            return false;
        }
    }

    /**
     * @description: Elimina un archivo de la biblioteca
     * @route: DELETE /api/biblioteca/delete/:id
     * @param req: Request
     * @param res: Response
     * @returns: Response
     */
    static async deleteFile(req: Request, res: Response) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'id es requerido',
                errors: []
            });
        }

        try {
            const archivo = await Archivo.findById(id);

            if (!archivo) {
                return res.status(404).json({
                    success: false,
                    message: 'Archivo no encontrado',
                    errors: []
                })
            }
            // Eliminar el archivo de la biblioteca
            await BibliotecaController.deleteFileById(id);
            return res.status(200).json({
                success: true,
                message: 'Archivo eliminado correctamente',
                content: archivo
            });
        } catch (error) {
            console.error('Error general:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
    }

    /**
     * @description: Elimina una carpeta de la biblioteca
     * @route: DELETE /api/biblioteca/folder/:id
     * @param req: Request
     * @param res: Response
     * @returns: Response
     */
    static async deleteFolder(req: Request, res: Response) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'id es requerido',
                errors: []
            });
        }

        try {
            const folder = await Folder.findById(id);
            const archivos: IArchivo[] = await Archivo.find({ folder: id });

            if (!folder) {
                return res.status(404).json({
                    success: false,
                    message: 'Carpeta no encontrada',
                    errors: []
                })
            }
            // Eliminar la carpeta de la biblioteca
            await Folder.findByIdAndDelete(id);
            //luego, eliminar todos los archivos que esten dentro de la carpeta
            for (const archivo of archivos) {
                await BibliotecaController.deleteFileById(archivo._id?.toString() || '');
            }
            return res.status(200).json({
                success: true,
                message: 'Carpeta y archivos eliminados correctamente',
                content: folder
            })

        } catch (error) {
            console.error('Error general:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
    }

    /**
     * @description: Busca un archivo de la biblioteca
     * @route: GET /biblioteca/search?params=values
     *   @param texto: Texto a buscar en el nombre del archivo o tipoArchivo (o folder)
     *   @param tipoArchivo: Tipo de archivo a buscar
     *   @param autor: ID del autor del archivo
     * @param req: Request
     * @param res: Response
     * @returns: Response
     */
    static async filterArchivo(req: Request, res: Response) {
        try {
            const { texto, tipoArchivo, autor } = req.query;

            const filtro: any = {};
            let carpetasCoincidentes: string | any[] = [];

            // Filtro por texto (nombre del archivo o tipoArchivo)
            if (texto) {
                filtro.$or = [
                    { nombre: { $regex: texto, $options: 'i' } },
                    { tipoArchivo: { $regex: texto, $options: 'i' } }
                ];
                carpetasCoincidentes = await Folder.find({
                    nombre: { $regex: texto as string, $options: 'i' }
                });
            }

            // Filtro por tipo de archivo (por si se desea buscar por tipo aparte de la barra de búsqueda)
            if (tipoArchivo) {
                filtro.tipoArchivo = { $regex: tipoArchivo, $options: 'i' };
            }

            // Filtro por autor (asegura que sea un ObjectId válido si aplica)
            if (autor) {
                if (!mongoose.Types.ObjectId.isValid(autor as string)) {
                    res.status(400).json({ message: 'ID de autor inválido' });
                    return;
                }
                filtro.autor = autor;
            }

            // Si no hay ningún filtro válido, no hacemos búsqueda
            if (Object.keys(filtro).length === 0 && !texto) {
                res.status(400).json({ message: 'Debe proporcionar al menos un parámetro de búsqueda' });
                return;
            }

            // Buscar archivos según filtros
            const archivos = await Archivo.find(filtro).populate('folder');

            // Si no hay resultados en ambos
            if (archivos.length === 0 && carpetasCoincidentes.length === 0) {
                res.status(404).json({ message: 'No se encontraron resultados con esos criterios' });
                return;
            }

            res.status(200).json({
                carpetas: carpetasCoincidentes,
                archivos
            });
        } catch (error) {
            const err = error as Error;
            res.status(500).json({ message: err.message });
        }
    }

    static async updateFile(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data: Partial<IArchivo> = req.body;
            const resultado = await Archivo.findByIdAndUpdate(id, data, { new: true });

            if (!resultado) {
                res.status(404).json({
                    message: 'No se pudo editar el archivo'
                })
                return;
            }
            res.status(200).json({
                resultado
            })
        } catch (error) {
            const err = error as Error;
            res.status(500).json({
                message: err.message
            });
        }
    }

    /* ====================== NUEVO: descarga del binario desde la VM ====================== */
    /**
     * @description: Descarga (o muestra inline) un archivo de la biblioteca (binario en VM)
     * @route: GET /api/biblioteca/files/:id
     * Query opcionales:
     *   - ?inline=1     -> intenta mostrar en el navegador (imágenes/PDF)
     *   - ?download=1   -> fuerza descarga
     */
    static async downloadArchivo(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const doc = await Archivo.findById(id);
            if (!doc) {
            res.status(404).json({ success: false, message: 'Archivo no encontrado' });
            return;
            }

            const abs = path.resolve(LIB_DIR, String(doc.key || ''));
            const libNorm = path.normalize(LIB_DIR + path.sep);
            const absNorm = path.normalize(abs);

            if (!absNorm.startsWith(libNorm)) {
            res.status(403).json({ success: false, message: 'Ruta inválida' });
            return;
            }

            if (doc.tipoArchivo) res.setHeader('Content-Type', doc.tipoArchivo);

            /* ====================== NUEVO: decidir inline vs attachment ====================== */
            const wantsDownload = req.query.download === '1';
            const wantsInline  = req.query.inline === '1';
            const isPreviewable =
            !!doc.tipoArchivo &&
            (doc.tipoArchivo.startsWith('image/') || doc.tipoArchivo === 'application/pdf');

            const disposition =
            (wantsDownload || (!wantsInline && !isPreviewable)) ? 'attachment' : 'inline';

            if (doc.nombre) {
            res.setHeader(
                'Content-Disposition',
                `${disposition}; filename="${encodeURIComponent(doc.nombre)}"`
            );
            }
            /* ====================== FIN NUEVO ====================== */

            const stream = fs.createReadStream(absNorm);
            stream.on('error', () =>
            res.status(404).json({ success: false, message: 'No se pudo abrir el archivo' })
            );
            stream.pipe(res);
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }
}
export default BibliotecaController;
