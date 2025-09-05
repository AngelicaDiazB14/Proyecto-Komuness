// src/utils/digitalOceanSpace.ts
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/srv/uploads';
const BASE_URL   = process.env.PUBLIC_BASE_URL || 'http://localhost';

function safeName(original: string) {
  return `${Date.now()}-${original.replace(/\s+/g, '_')}`;
}

async function writeToDisk(buf: Buffer, relKey: string) {
  const fullPath = path.join(UPLOAD_DIR, relKey);
  await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.promises.writeFile(fullPath, buf);
  return {
    location: `${BASE_URL}/uploads/${relKey}`,
    key: relKey
  };
}

/** Sube un archivo (buffer o path) y devuelve { location, key } */
export async function uploadFile(file: any, prefix: string = ''): Promise<{location: string; key: string}> {
  const name = (prefix ? `${prefix}/` : '') + safeName(file.originalname || 'file');
  const buffer = file.buffer || (file.path ? await fs.promises.readFile(file.path) : null);
  if (!buffer) throw new Error('No file buffer/path provided');
  return writeToDisk(buffer, name);
}

/** Compat con tu controlador de biblioteca */
export async function uploadFileStorage(file: any, folderId: string = ''): Promise<{location: string; key: string}> {
  const name = (folderId ? `${folderId}/` : '') + safeName(file.originalname || 'file');
  const buffer = file.buffer || (file.path ? await fs.promises.readFile(file.path) : null);
  if (!buffer) throw new Error('No file buffer/path provided');
  return writeToDisk(buffer, name);
}

export default { uploadFile, uploadFileStorage };

