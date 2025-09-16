import { Request, Response } from 'express';
import { IAdjunto, IComentario, IPublicacion } from '../interfaces/publicacion.interface';
import { modelPublicacion } from '../models/publicacion.model';
import mongoose from 'mongoose';
import { saveMulterFileToGridFS, saveBufferToGridFS, deleteGridFSFile } from '../utils/gridfs';

const LOG_ON = process.env.LOG_PUBLICACION === '1';

// Utilidad: normaliza precio (string → number | undefined)
function parsePrecio(input: any): number | undefined {
  if (input === undefined || input === null) return undefined;
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return undefined;
    // elimina símbolos comunes y separadores de miles
    const cleaned = trimmed.replace(/[₡$,]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function mustRequirePrecio(tag?: string): boolean {
  return tag === 'evento' || tag === 'emprendimiento';
}

// Crear una publicación (sin adjuntos)
export const createPublicacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as IPublicacion & Record<string, any>;

    const precio = parsePrecio(body.precio);
    const tag = body.tag;

    if (LOG_ON) {
      console.log('[Publicaciones][createPublicacion] req.body.precio:', body.precio, '→ normalizado:', precio);
      console.log('[Publicaciones][createPublicacion] tag:', tag);
    }

    if (mustRequirePrecio(tag) && (precio === undefined)) {
      res.status(400).json({ message: 'El campo precio es obligatorio y debe ser numérico para eventos/emprendimientos.' });
      return;
    }

    const publicacion: IPublicacion = {
      ...body,
      publicado: `${(body as any).publicado}` === 'true',
      precio, // ← sobrescribimos ya normalizado
    } as IPublicacion;

    const nuevaPublicacion = new modelPublicacion(publicacion);

    if (LOG_ON) {
      console.log('[Publicaciones][createPublicacion] doc a guardar (clave precio):', nuevaPublicacion.precio);
    }

    const savePost = await nuevaPublicacion.save();
    res.status(201).json(savePost);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

// Crear publicación con adjuntos v2 (GridFS)
export const createPublicacionA = async (req: Request, res: Response): Promise<void> => {
  try {
    const publicacion = req.body as IPublicacion & Record<string, any>;

    // --- Recolectar archivos desde Multer (array o fields) ---
    let files: Express.Multer.File[] = [];
    if (Array.isArray(req.files)) {
      files = req.files as Express.Multer.File[];
    } else if (req.files && typeof req.files === 'object') {
      const map = req.files as Record<string, Express.Multer.File[] | undefined>;
      files = [ ...(map['archivos'] ?? []), ...(map['imagenes'] ?? []) ];
    }

    // --- Validar/establecer categoria ---
    let categoria: any = (publicacion as any).categoria;
    if (!categoria) {
      const defId = process.env.DEFAULT_CATEGORIA_ID;
      if (defId && mongoose.Types.ObjectId.isValid(defId)) {
        categoria = defId;
      } else {
        res.status(400).json({
          ok: false,
          message: 'categoria es requerida (envía "categoria" o configura DEFAULT_CATEGORIA_ID en .env)'
        });
        return;
      }
    }

    // --- Precio ---
    const precio = parsePrecio((publicacion as any).precio);
    const tag = (publicacion as any).tag;

    if (LOG_ON) {
      console.log('[Publicaciones][createPublicacionA] body.precio:', (publicacion as any).precio, '→ normalizado:', precio);
      console.log('[Publicaciones][createPublicacionA] tag:', tag);
    }

    if (mustRequirePrecio(tag) && (precio === undefined)) {
      res.status(400).json({ ok: false, message: 'El campo precio es obligatorio y debe ser numérico para eventos/emprendimientos.' });
      return;
    }

    // --- Subir adjuntos (0..N) ---
    const adjuntos: IAdjunto[] = [];
    for (const file of files) {
      const result = await saveMulterFileToGridFS(file, 'publicaciones');
      adjuntos.push({
        url: `${process.env.PUBLIC_BASE_URL || 'http://159.54.148.238'}/api/files/${result.id.toString()}`,
        key: result.id.toString(),
      });
    }

    // --- Crear documento y guardar ---
    const nuevaPublicacion = new modelPublicacion({
      ...publicacion,
      categoria,
      adjunto: adjuntos,
      // normalizaciones útiles:
      publicado: `${(publicacion as any).publicado}` === 'true',
      precio, // ← sobrescribimos ya normalizado
    });

    if (LOG_ON) {
      console.log('[Publicaciones][createPublicacionA] doc a guardar (clave precio):', nuevaPublicacion.precio);
    }

    const savePost = await nuevaPublicacion.save();
    res.status(201).json(savePost);
  } catch (error) {
    console.error('createPublicacionA error:', error);
    const err = error as Error;
    res.status(500).json({ ok: false, message: err.message });
  }
};

// obtener publicaciones por tag
export const getPublicacionesByTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;
    const { tag, publicado, categoria } = req.query as { tag?: string; publicado?: string, categoria?: string;};
    
    const query: any = {}; 
    if (tag) query.tag = tag;
    if (publicado !== undefined) query.publicado = (publicado === 'true');
    
    if (categoria) {
      query.categoria = categoria;
    }
    const [publicaciones, totalPublicaciones] = await Promise.all([
      modelPublicacion.find(query)
        .populate('autor', 'nombre')
        .populate('categoria', 'nombre estado') 
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit),
      modelPublicacion.countDocuments(query),
    ]);

    res.status(200).json({
      data: publicaciones,
      pagination: {
        offset,
        limit,
        total: totalPublicaciones,
        pages: Math.ceil(totalPublicaciones / Math.max(limit, 1)),
      },
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

// Obtener una publicación por su ID
export const getPublicacionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const publicacion: IPublicacion | null = await modelPublicacion.findById(id)
      .populate('autor', 'nombre')
      .populate('categoria', 'nombre estado'); 

    if (!publicacion) {
      res.status(404).json({ message: 'Publicación no encontrada' });
      return;
    }
    res.status(200).json(publicacion);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

// Obtener publicaciones por categoría
export const getPublicacionesByCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoriaId } = req.params;
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;

    const query = { categoria: categoriaId, publicado: true };

    const [publicaciones, total] = await Promise.all([
      modelPublicacion.find(query)
        .populate('autor', 'nombre')
        .populate('categoria', 'nombre estado') 
        .skip(offset)
        .limit(limit),
      modelPublicacion.countDocuments(query)
    ]);

    res.status(200).json({
      data: publicaciones,
      pagination: {
        offset,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

// Actualizar una publicación
export const updatePublicacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedData: Partial<IPublicacion> & Record<string, any> = { ...req.body };

    if (updatedData.hasOwnProperty('precio')) {
      const parsed = parsePrecio(updatedData.precio);
      if (LOG_ON) {
        console.log('[Publicaciones][updatePublicacion] body.precio:', updatedData.precio, '→ normalizado:', parsed);
      }
      updatedData.precio = parsed;
    }

    // Si cambia tag a evento/emprendimiento y no trae precio válido:
    if (mustRequirePrecio(updatedData.tag) && (updatedData.precio === undefined)) {
      res.status(400).json({ message: 'El campo precio es obligatorio y debe ser numérico para eventos/emprendimientos.' });
      return;
    }

    const publicacion = await modelPublicacion.findByIdAndUpdate(id, updatedData, { new: true });
    if (!publicacion) {
      res.status(404).json({ message: 'Publicación no encontrada' });
      return;
    }
    res.status(200).json(publicacion);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

// Eliminar una publicación (y sus adjuntos en GridFS)
export const deletePublicacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedPost = await modelPublicacion.findByIdAndDelete(id);

    if (!deletedPost) {
      res.status(404).json({ message: 'Publicación no encontrada' });
      return;
    }

    const adjuntos = (deletedPost as any).adjunto as IAdjunto[] | undefined;
    if (adjuntos?.length) {
      for (const a of adjuntos) {
        if (a.key) {
          try { await deleteGridFSFile(a.key); } catch {}
        }
      }
    }

    res.status(200).json({ message: 'Publicación eliminada correctamente' });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

// Agregar comentario
export const addComentario = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { autor, contenido, fecha } = req.body;

  const nuevoComentario: IComentario = { autor, contenido, fecha };

  try {
    const publicacionActualizada = await modelPublicacion.findByIdAndUpdate(
      id,
      { $push: { comentarios: nuevoComentario } },
      { new: true }
    );

    if (!publicacionActualizada) {
      res.status(404).json({ message: 'Publicación no encontrada' });
      return;
    }
    res.status(201).json(publicacionActualizada);
  } catch (error) {
    console.warn('Error al agregar comentario:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

// filtros de búsqueda
export const filterPublicaciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const { texto, tag, autor } = req.query;
    const filtro: any = {};

    if (texto) {
      filtro.$or = [
        { titulo: { $regex: texto, $options: 'i' } },
        { contenido: { $regex: texto, $options: 'i' } },
      ];
    }
    if (tag) filtro.tag = { $regex: tag, $options: 'i' };
    if (autor) {
      if (!mongoose.Types.ObjectId.isValid(autor as string)) {
        res.status(400).json({ message: 'ID de autor inválido' });
        return;
      }
      filtro.autor = autor;
    }

    if (Object.keys(filtro).length === 0) {
      res.status(400).json({ message: 'Debe proporcionar al menos un parámetro de búsqueda (titulo, tag o autor)' });
      return;
    }

    const publicaciones: IPublicacion[] = await modelPublicacion.find(filtro);

    if (publicaciones.length === 0) {
      res.status(404).json({ message: 'No se encontraron publicaciones con esos criterios' });
      return;
    }

    res.status(200).json(publicaciones);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

// Obtener eventos por rango de fechas
export const getEventosPorFecha = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({ message: 'Se requieren startDate y endDate' });
      return;
    }

    const eventos = await modelPublicacion.find({
      tag: 'evento',
      publicado: true,
      fechaEvento: {
        $gte: startDate as string,
        $lte: endDate as string
      }
    })
    .populate('autor', 'nombre')
    .populate('categoria', 'nombre')
    // 🔁 CAMBIO: incluir precio en la selección
    .select('titulo fechaEvento horaEvento contenido adjunto _id precio')
    .sort({ fechaEvento: 1}); 

    res.status(200).json(eventos);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};
