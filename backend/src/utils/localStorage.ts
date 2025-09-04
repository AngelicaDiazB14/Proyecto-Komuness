// src/utils/localStorage.ts
import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://159.54.148.238';
const BASE_DIR = process.env.BIBLIOTECA_DIR || '/var/komuness/library';

/** Crea el directorio si no existe */
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Guarda un archivo de Multer en almacenamiento local permanente
 * @param file Multer.File (diskStorage: tiene .path)
 * @param folderId string | '0' para raíz
 * @returns { location, key }
 */
export async function saveLocalFile(
  file: Express.Multer.File,
  folderId?: string
): Promise<{ location: string; key: string }> {
  const subdir = folderId && folderId !== '0' ? folderId : 'root';
  const destDir = path.join(BASE_DIR, subdir);
  ensureDir(destDir);

  const safeExt = path.extname(file.originalname) || '';
  const safeBase = path.basename(file.originalname, safeExt).replace(/[^\w\-\.]+/g, '_');
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${safeExt}`;
  const destPath = path.join(destDir, uniqueName);

  // mover del tmp de multer al destino final
  await fs.promises.rename(file.path, destPath);

  const key = `${subdir}/${uniqueName}`;
  const location = `${PUBLIC_BASE_URL}/biblioteca-files/${key}`;
  return { location, key };
}

/** Borra un archivo por key relativa (subdir/filename) */
export async function deleteLocalByKey(key: string): Promise<void> {
  const full = path.join(BASE_DIR, key);
  try {
    await fs.promises.unlink(full);
  } catch {
    // si no existe, ignorar
  }
}
