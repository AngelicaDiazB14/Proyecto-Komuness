import mongoose from 'mongoose';

let bucket: mongoose.mongo.GridFSBucket | null = null;

function getBucket(): mongoose.mongo.GridFSBucket {
  if (!bucket) {
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB no está conectado');
    bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
  }
  return bucket;
}

/**
 * Guarda un Buffer en GridFS
 */
export function saveBufferToGridFS(
  buffer: Buffer,
  filename: string,
  mimetype?: string
): Promise<{ id: any; filename: string }> {
  return new Promise((resolve, reject) => {
    const bkt = getBucket();

    const uploadStream = bkt.openUploadStream(filename, {
      contentType: mimetype,
    });

    uploadStream.once('error', reject);
    // OJO: 'finish' NO recibe argumentos; usa uploadStream.id
    uploadStream.once('finish', () => {
      resolve({ id: uploadStream.id, filename: uploadStream.filename });
    });

    uploadStream.end(buffer);
  });
}

/**
 * Guarda un archivo de Multer en GridFS
 */
export function saveMulterFileToGridFS(
  file: Express.Multer.File,
  prefix?: string
): Promise<{ id: any; filename: string }> {
  const safeName =
    (prefix ? `${prefix}/` : '') + `${Date.now()}_${file.originalname}`;
  return saveBufferToGridFS(file.buffer, safeName, file.mimetype);
}

/**
 * Alias de compatibilidad con código antiguo
 * (por si en algún punto se importó uploadBufferToGridFS)
 */
export { saveBufferToGridFS as uploadBufferToGridFS };

/**
 * Borra un archivo por id en GridFS
 */
export async function deleteGridFSFile(id: string) {
  const bkt = getBucket();
  await bkt.delete(new mongoose.Types.ObjectId(id));
}
