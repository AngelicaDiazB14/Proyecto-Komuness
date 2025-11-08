import { Request, Response } from "express";
import { modelSeccionAcerca } from "../models/seccionAcerca.model";
import fs from 'fs';
import path from 'path';
import fsp from 'fs/promises';
import multer from 'multer';

/**
 * Carpeta base para las imágenes de ACERCA DE en la VM.
 * Compatible con producción (ACERCADE_LIB)
 */
const ACERCADE_BASE_DIR = process.env.ACERCADE_LIB || '/srv/uploads/acercade';

console.log('Configuración Acerca De - Directorio:', ACERCADE_BASE_DIR);

const MAX_IMAGENES_PROYECTOS = parseInt(process.env.MAX_IMAGENES_PROYECTOS || '50');
const MAX_IMAGENES_EQUIPO = parseInt(process.env.MAX_IMAGENES_EQUIPO || '50');

/** Asegura subcarpeta por año/mes */
async function ensureAcercaDeDir(): Promise<string> {
  try {
    console.log('ensureAcercaDeDir - Iniciando...');
    console.log('Directorio base:', ACERCADE_BASE_DIR);
    
    // Primero asegurar el directorio base
    await fsp.mkdir(ACERCADE_BASE_DIR, { recursive: true });
    console.log('Directorio base creado/verificado');
    
    const now = new Date();
    const dir = path.join(
      ACERCADE_BASE_DIR,
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, '0')
    );
    
    console.log('Creando subdirectorio:', dir);
    await fsp.mkdir(dir, { recursive: true });
    
    // Verificar permisos de escritura
    await fsp.access(dir, fsp.constants.W_OK);
    console.log('Directorio escribible:', dir);
    
    return dir;
  } catch (error) {
    console.error('ERROR en ensureAcercaDeDir:', error);
    throw error;
  }
}

/** Sanitiza el nombre del archivo */
function sanitizeName(name: string) {
  return name.replace(/[^\w.\- ]+/g, '_');
}

/**
 * Multer especializado para Acerca De
 */
export const uploadAcercaDe = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, cb) => {
      try {
        console.log('Multer - Iniciando destino...');
        const dir = await ensureAcercaDeDir();
        console.log('Multer - Directorio listo:', dir);
        cb(null, dir);
      } catch (err) {
        console.error('Multer - Error en destino:', err);
        cb(err as any, ACERCADE_BASE_DIR);
      }
    },
    filename: (_req, file, cb) => {
      const safe = sanitizeName(file.originalname);
      const filename = `${Date.now()}-${safe}`;
      console.log(' Multer - Nombre de archivo:', filename);
      cb(null, filename);
    },
  }),
  fileFilter: (req, file, cb) => {
    console.log('Multer verificando tipo:', file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});



/**
 * Obtener la sección acerca de (solo activa)
 */
export const getSeccionAcerca = async (req: Request, res: Response): Promise<void> => {
  try {
    let seccion = await modelSeccionAcerca.findOne({ estado: true });
    
    if (!seccion) {
      console.log('Creando sección acerca de por defecto...');
      // Crear una sección por defecto con toda la información
      const seccionDefault = new modelSeccionAcerca({
        titulo: "COOPESINERGIA R.L. - Tejiendo Futuro en Comunidad",
        contenido: "Coopesinergia R.L. es una cooperativa autogestionaria de carácter cultural y comunitario que ejecuta proyectos para el desarrollo humano. Actualmente estamos trabajando en Tejarcillos de Alajuelita, un territorio marcado por la migración, la pobreza y el abandono institucional, pero con una enorme riqueza humana, creativa y solidaria. Desde este contexto, el proyecto Komuness surge como una respuesta colectiva, diseñada y impulsada en conjunto con los líderes juveniles y las familias, para crear espacios dignos, seguros y significativos para la niñez, adolescencia y juventudes, donde el arte, la educación y la cooperación sean motores de transformación social.",
        historia: "Nuestra historia...",
        mision: "Nuestra misión...",
        vision: "Nuestra visión...",
        queHacemos: "Nuestro trabajo parte del convencimiento de que el arte no es un lujo, sino una herramienta vital para la reconstrucción del tejido social, la afirmación de la identidad y la generación de bienestar integral. En Tejarcillos, la cultura es raíz, refugio y resistencia.",
        motivacion: "Nace de la certeza de que la ternura y la acción colectiva pueden transformar la exclusión en memoria de superación y la precariedad en esperanza y oportunidades.",
        impacto: "Cada clase, mural o comida compartida es un acto de dignidad. Estos espacios ya están dando frutos tangibles...",
        uneteCausa: "Te invitamos a ser parte de esta transformación colectiva. Tu apoyo puede tomar muchas formas...",
        informacionDonaciones: {
          cuentaBancaria: "0005964154",
          iban: "CR86016111084159641540",
          nombreCuenta: "Coopesinergia",
          cedulaJuridica: "3-002-639930",
          emailFinanzas: "coopesinergiafinanzas@gmail.com",
          donacionesEspecie: [
            "Alimentos en buen estado para el comedor",
            "Materiales para nuestros procesos creativos",
            "Ropa nueva o usada en buen estado"
          ]
        },
        contactos: {
          telefono: "85690514",
          email: "komunesscr@gmail.com",
          facebook: "https://www.facebook.com/komuness",
          instagram: "https://www.instagram.com/komunesscr/"
        },
        equipo: [],
        imagenesProyectos: [],
        imagenesEquipo: []
      });
      
      const saved = await seccionDefault.save();
      console.log('Sección acerca de creada por defecto');
      res.json(saved);
      return;
    }

    // Si el documento existe pero le faltan campos nuevos, actualizarlos con valores por defecto
    if (!seccion.queHacemos) {
      seccion.queHacemos = "Nuestro trabajo parte del convencimiento de que el arte no es un lujo, sino una herramienta vital para la reconstrucción del tejido social, la afirmación de la identidad y la generación de bienestar integral. En Tejarcillos, la cultura es raíz, refugio y resistencia.";
    }
    if (!seccion.motivacion) {
      seccion.motivacion = "Nace de la certeza de que la ternura y la acción colectiva pueden transformar la exclusión en memoria de superación y la precariedad en esperanza y oportunidades.";
    }
    if (!seccion.impacto) {
      seccion.impacto = "Cada clase, mural o comida compartida es un acto de dignidad. Estos espacios ya están dando frutos tangibles...";
    }
    if (!seccion.uneteCausa) {
      seccion.uneteCausa = "Te invitamos a ser parte de esta transformación colectiva. Tu apoyo puede tomar muchas formas...";
    }
    if (!seccion.informacionDonaciones) {
      seccion.informacionDonaciones = {
        cuentaBancaria: "0005964154",
        iban: "CR86016111084159641540",
        nombreCuenta: "Coopesinergia",
        cedulaJuridica: "3-002-639930",
        emailFinanzas: "coopesinergiafinanzas@gmail.com",
        donacionesEspecie: [
          "Alimentos en buen estado para el comedor",
          "Materiales para nuestros procesos creativos",
          "Ropa nueva o usada en buen estado"
        ]
      };
    }

    // Guardar los cambios si se actualizaron campos
    await seccion.save();

    res.json(seccion);
  } catch (error) {
    console.error('Error en getSeccionAcerca:', error);
    res.status(500).json({ message: "Error al obtener la sección acerca de" });
  }
};

/**
 * Crear o actualizar sección acerca de
 */
export const createOrUpdateSeccionAcerca = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Body recibido en createOrUpdateSeccionAcerca:', JSON.stringify(req.body, null, 2));
    
    const { 
      titulo, 
      contenido, 
      historia, 
      mision, 
      vision, 
      queHacemos,
      motivacion,
      impacto,
      uneteCausa,
      informacionDonaciones,
      contactos, 
      equipo 
    } = req.body;

    // Validar que los datos existen
    if (!titulo && !contenido) {
      res.status(400).json({ message: "Datos incompletos" });
      return;
    }

    let seccion = await modelSeccionAcerca.findOne({ estado: true });

    if (seccion) {
      // Actualizar con valores por defecto si son undefined
      const updateData = {
        titulo: titulo !== undefined ? titulo : seccion.titulo,
        contenido: contenido !== undefined ? contenido : seccion.contenido,
        historia: historia !== undefined ? historia : seccion.historia,
        mision: mision !== undefined ? mision : seccion.mision,
        vision: vision !== undefined ? vision : seccion.vision,
        queHacemos: queHacemos !== undefined ? queHacemos : seccion.queHacemos,
        motivacion: motivacion !== undefined ? motivacion : seccion.motivacion,
        impacto: impacto !== undefined ? impacto : seccion.impacto,
        uneteCausa: uneteCausa !== undefined ? uneteCausa : seccion.uneteCausa,
        informacionDonaciones: informacionDonaciones !== undefined ? informacionDonaciones : seccion.informacionDonaciones,
        contactos: contactos !== undefined ? contactos : seccion.contactos,
        equipo: equipo !== undefined ? equipo : seccion.equipo
      };

      console.log('Actualizando sección con:', updateData);

      // Usar findOneAndUpdate para mejor control
      const updated = await modelSeccionAcerca.findOneAndUpdate(
        { estado: true },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updated) {
        res.status(404).json({ message: "No se encontró la sección para actualizar" });
        return;
      }

      console.log('Sección actualizada exitosamente');
      res.json(updated);
    } else {
      // Crear nueva con valores por defecto para campos requeridos
      const nuevaSeccion = new modelSeccionAcerca({
        titulo: titulo || "Título por defecto",
        contenido: contenido || "Contenido por defecto",
        historia: historia || "Historia por defecto",
        mision: mision || "Misión por defecto",
        vision: vision || "Visión por defecto",
        queHacemos: queHacemos || "Qué hacemos por defecto",
        motivacion: motivacion || "Motivación por defecto",
        impacto: impacto || "Impacto por defecto",
        uneteCausa: uneteCausa || "Únete a nuestra causa por defecto",
        informacionDonaciones: informacionDonaciones || {
          cuentaBancaria: "0005964154",
          iban: "CR86016111084159641540",
          nombreCuenta: "Coopesinergia",
          cedulaJuridica: "3-002-639930",
          emailFinanzas: "coopesinergiafinanzas@gmail.com",
          donacionesEspecie: []
        },
        contactos: contactos || {
          telefono: "85690514",
          email: "komunesscr@gmail.com",
          facebook: "",
          instagram: ""
        },
        equipo: equipo || [],
        imagenesProyectos: [],
        imagenesEquipo: []
      });

      const saved = await nuevaSeccion.save();
      console.log('Nueva sección creada:', saved);
      res.status(201).json(saved);
    }
  } catch (error: unknown) {
    console.error('Error en createOrUpdateSeccionAcerca:', error);
    
    let errorMessage = "Error al guardar la sección acerca de";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    res.status(500).json({ 
      message: "Error al guardar la sección acerca de",
      error: errorMessage 
    });
  }
};

/**
 * Subir imagen para proyectos o equipo - AHORA EN DISCO DE LA VM
 */
export const uploadImagen = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('INICIANDO UPLOAD IMAGEN - Acerca De');
    const { tipo } = req.body;
    
    if (!req.file) {
      console.log('ERROR: No se recibió archivo');
      res.status(400).json({ message: "No se subió ningún archivo" });
      return;
    }

    console.log('Archivo recibido:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    if (!['proyectos', 'equipo'].includes(tipo)) {
      console.log('ERROR: Tipo inválido:', tipo);
      await fsp.unlink(req.file.path);
      res.status(400).json({ message: "Tipo debe ser 'proyectos' o 'equipo'" });
      return;
    }

    const seccion = await modelSeccionAcerca.findOne({ estado: true });
    if (!seccion) {
      console.log('ERROR: No se encontró sección acerca de');
      await fsp.unlink(req.file.path);
      res.status(404).json({ message: "No se encontró la sección acerca de" });
      return;
    }

    /* ====================== Calcular URL y key ====================== */
    const relKey = path
      .relative(ACERCADE_BASE_DIR, req.file.path)
      .split(path.sep)
      .join('/');

    // GENERAR URL QUE COINCIDA CON NGINX (/acercade/)
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://komuness.duckdns.org';
    const imagenUrl = `${publicBaseUrl}/acercade/${relKey}`;

    console.log(' Key generada:', relKey);
    console.log('URL generada (NUEVA):', imagenUrl);

    if (tipo === 'proyectos') {
      if (seccion.imagenesProyectos.length >= MAX_IMAGENES_PROYECTOS) {
        await fsp.unlink(req.file.path);
        res.status(400).json({ message: "Máximo 50 imágenes para proyectos" });
        return;
      }
      seccion.imagenesProyectos.push(imagenUrl);
      console.log('Imagen agregada a proyectos. Total:', seccion.imagenesProyectos.length);
    } else {
      if (seccion.imagenesEquipo.length >= MAX_IMAGENES_EQUIPO) {
        await fsp.unlink(req.file.path);
        res.status(400).json({ message: "Máximo 50 imágenes para equipo" });
        return;
      }
      seccion.imagenesEquipo.push(imagenUrl);
      console.log('📸 Imagen agregada a equipo. Total:', seccion.imagenesEquipo.length);
    }

    await seccion.save();
    console.log('IMAGEN SUBIDA EXITOSAMENTE con nueva URL');
    
    res.json({ 
      message: "Imagen subida exitosamente", 
      path: imagenUrl,
      key: relKey
    });

  } catch (error) {
    console.error('ERROR CRÍTICO en uploadImagen:', error);
    
    if (req.file) {
      try {
        await fsp.unlink(req.file.path);
        console.log('Archivo temporal eliminado por error');
      } catch (e) {
        console.warn(' No se pudo eliminar archivo temporal:', e);
      }
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error interno del servidor al subir imagen",
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Eliminar imagen
 */
export const deleteImagen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tipo, imagenPath } = req.body;
    console.log('🗑️ Eliminando imagen:', { tipo, imagenPath });
    
    const seccion = await modelSeccionAcerca.findOne({ estado: true });

    if (!seccion) {
      res.status(404).json({ message: "No se encontró la sección acerca de" });
      return;
    }

    /* ====================== Extraer key de la URL y eliminar del disco ====================== */
    try {
      // CORREGIDO: Extraer key de la nueva URL (/acercade/)
      const urlObj = new URL(imagenPath);
      const key = urlObj.pathname.replace('/acercade/', '');
      
      const absPath = path.resolve(ACERCADE_BASE_DIR, key);
      const acercaDeNorm = path.normalize(ACERCADE_BASE_DIR + path.sep);
      const absNorm = path.normalize(absPath);

      console.log(' Eliminando del disco:', absNorm);

      // Validar seguridad y eliminar
      if (absNorm.startsWith(acercaDeNorm) && fs.existsSync(absNorm)) {
        await fsp.unlink(absNorm);
        console.log(`Imagen eliminada del disco: ${absNorm}`);
      } else {
        console.warn(`No se encontró la imagen en disco: ${absNorm}`);
      }
    } catch (e) {
      console.warn('No se pudo eliminar el binario en disco:', e);
    }

    // Eliminar de la base de datos
    if (tipo === 'proyectos') {
      seccion.imagenesProyectos = seccion.imagenesProyectos.filter(img => img !== imagenPath);
      console.log('Imagen eliminada de proyectos');
    } else {
      seccion.imagenesEquipo = seccion.imagenesEquipo.filter(img => img !== imagenPath);
      console.log('Imagen eliminada de equipo');
    }

    await seccion.save();
    res.json({ message: "Imagen eliminada exitosamente" });
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({ message: "Error al eliminar imagen" });
  }
};

/**
 * @description: Descarga (o muestra) una imagen de Acerca De
 * @route: GET /api/acerca-de/files/:key
 */
export const downloadImagen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    console.log(' Solicitando imagen con key:', key);
    
    const abs = path.resolve(ACERCADE_BASE_DIR, key);
    const acercaDeNorm = path.normalize(ACERCADE_BASE_DIR + path.sep);
    const absNorm = path.normalize(abs);

    console.log(' Ruta absoluta:', absNorm);

    // Validar seguridad
    if (!absNorm.startsWith(acercaDeNorm)) {
      console.log('Ruta inválida - seguridad');
      res.status(403).json({ success: false, message: 'Ruta inválida' });
      return;
    }

    if (!fs.existsSync(absNorm)) {
      console.log('Archivo no existe:', absNorm);
      res.status(404).json({ success: false, message: 'Imagen no encontrada' });
      return;
    }

    // Determinar content type basado en extensión
    const ext = path.extname(absNorm).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[ext] || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Disposition', 'inline');

    console.log('Sirviendo imagen:', absNorm);
    const stream = fs.createReadStream(absNorm);
    
    stream.on('error', (error) => {
      console.error(' Error al leer archivo:', error);
      res.status(500).json({ success: false, message: 'Error al leer la imagen' });
    });
    
    stream.pipe(res);
    
  } catch (error) {
    console.error('Error en downloadImagen:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: (error as Error).message 
    });
  }
};

/**
 * Subir imagen de perfil para un miembro del equipo
 */
export const uploadImagenMiembro = async (req: Request, res: Response): Promise<void> => {
  try {
    const { miembroIndex } = req.body;
    console.log('Subiendo imagen para miembro:', miembroIndex);
    
    if (!req.file) {
      res.status(400).json({ message: "No se subió ningún archivo" });
      return;
    }

    if (miembroIndex === undefined || miembroIndex === null) {
      await fsp.unlink(req.file.path);
      res.status(400).json({ message: "miembroIndex es requerido" });
      return;
    }

    const seccion = await modelSeccionAcerca.findOne({ estado: true });
    if (!seccion) {
      await fsp.unlink(req.file.path);
      res.status(404).json({ message: "No se encontró la sección acerca de" });
      return;
    }

    // Verificar que el índice del miembro existe
    if (!seccion.equipo[miembroIndex]) {
      await fsp.unlink(req.file.path);
      res.status(400).json({ message: "Miembro del equipo no encontrado" });
      return;
    }

    /* ====================== Calcular URL y key ====================== */
    const relKey = path
      .relative(ACERCADE_BASE_DIR, req.file.path)
      .split(path.sep)
      .join('/');

    // CORREGIDO: Generar URL que coincida con NGINX (/acercade/)
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://komuness.duckdns.org';
    const imagenUrl = `${publicBaseUrl}/acercade/${relKey}`;

    console.log('Key generada para miembro:', relKey);
    console.log('URL generada para miembro (CORREGIDA):', imagenUrl);

    // Actualizar la imagen del miembro
    seccion.equipo[miembroIndex].imagen = imagenUrl;

    await seccion.save();
    console.log('Imagen de perfil subida exitosamente para miembro:', miembroIndex);
    
    res.json({ 
      message: "Imagen de perfil subida exitosamente", 
      path: imagenUrl,
      key: relKey
    });
  } catch (error) {
    console.error('Error al subir imagen de miembro:', error);
    if (req.file) {
      try {
        await fsp.unlink(req.file.path);
      } catch (e) {
        console.warn('No se pudo eliminar archivo en error:', e);
      }
    }
    res.status(500).json({ message: "Error al subir imagen de perfil" });
  }
};

/**
 * Eliminar imagen de perfil de un miembro del equipo
 */
export const deleteImagenMiembro = async (req: Request, res: Response): Promise<void> => {
  try {
    const { miembroIndex, imagenPath } = req.body;
    console.log('Eliminando imagen de miembro:', { miembroIndex, imagenPath });
    
    const seccion = await modelSeccionAcerca.findOne({ estado: true });

    if (!seccion) {
      res.status(404).json({ message: "No se encontró la sección acerca de" });
      return;
    }

    // Verificar que el índice del miembro existe
    if (!seccion.equipo[miembroIndex]) {
      res.status(400).json({ message: "Miembro del equipo no encontrado" });
      return;
    }

    /* ====================== Eliminar del disco ====================== */
    try {
      // CORREGIDO: Extraer key de la nueva URL (/acercade/)
      const urlObj = new URL(imagenPath);
      const key = urlObj.pathname.replace('/acercade/', '');
      
      const absPath = path.resolve(ACERCADE_BASE_DIR, key);
      const acercaDeNorm = path.normalize(ACERCADE_BASE_DIR + path.sep);
      const absNorm = path.normalize(absPath);

      // Validar seguridad y eliminar
      if (absNorm.startsWith(acercaDeNorm) && fs.existsSync(absNorm)) {
        await fsp.unlink(absNorm);
        console.log(`Imagen de perfil eliminada del disco: ${absNorm}`);
      }
    } catch (e) {
      console.warn('No se pudo eliminar el binario en disco:', e);
    }

    // Eliminar de la base de datos
    seccion.equipo[miembroIndex].imagen = undefined;

    await seccion.save();
    console.log('Imagen de perfil eliminada de la base de datos');
    
    res.json({ message: "Imagen de perfil eliminada exitosamente" });
  } catch (error) {
    console.error('Error al eliminar imagen de miembro:', error);
    res.status(500).json({ message: "Error al eliminar imagen de perfil" });
  }
};