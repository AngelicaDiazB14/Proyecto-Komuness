import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

// Tamaño máximo por archivo (MB). Prioriza UPLOAD_MAX_FILE_SIZE_MB, luego LIBRARY_MAX_FILE_SIZE_MB, por defecto 200MB
// Añadimos un pequeño margen (slack) en bytes para cubrir overhead del multipart/form-data (boundaries, headers).
const maxFileSizeMB = parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB || process.env.LIBRARY_MAX_FILE_SIZE_MB || '200', 10);
const maxFileSizeSlackBytes = parseInt(process.env.UPLOAD_MAX_FILE_SIZE_SLACK_BYTES || String(1 * 1024 * 1024), 10); // 1 MB por defecto
// Cantidad máxima de archivos por subida
const maxFilesPerUpload = parseInt(process.env.UPLOAD_MAX_FILES || '20', 10);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = process.env.NODE_ENV === 'production'
      ? '/tmp/uploads'
      : path.join(__dirname, '../tmp/uploads');

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter: multer.Options['fileFilter'] = (_req, _file, cb) => cb(null, true);

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    // Aplicar slack para permitir que la sobrecarga de multipart no provoque rechazos cuando el archivo
    // pesa exactamente el límite (por ejemplo 200MB). Valor = configured MB + slack bytes.
    fileSize: (maxFileSizeMB * 1024 * 1024) + maxFileSizeSlackBytes,
    files: maxFilesPerUpload,
  },
});

// Storage específico para perfiles de usuario
const perfilStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isProd = process.env.NODE_ENV === 'production';

    let folder: string;

    // Determinar carpeta según tipo de archivo
    if (file.mimetype === 'application/pdf') {
      // CVs
      if (isProd) {
        folder = process.env.CSV_LIB || '/srv/uploads/csv';
      } else {
        folder = path.join(__dirname, '../tmp/uploads/perfiles/cvs');
      }
    } else {
      // Fotos de perfil
      if (isProd) {
        folder = process.env.PROFILE_LIB || '/srv/uploads/perfil';
      } else {
        folder = path.join(__dirname, '../tmp/uploads/perfiles/fotos');
      }
    }

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtro para fotos de perfil (solo imágenes)
const fotoPerfilFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
  }
};

// Filtro para CVs (solo PDFs)
const cvFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'));
  }
};

// Multer para fotos de perfil (max 5MB)
export const uploadFotoPerfil = multer({
  storage: perfilStorage,
  fileFilter: fotoPerfilFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
});

// Multer para CVs (max 10MB)
export const uploadCV = multer({
  storage: perfilStorage,
  fileFilter: cvFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
});
