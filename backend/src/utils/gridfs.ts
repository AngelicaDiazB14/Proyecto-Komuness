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

export function saveBufferToGridFS(
  buffer: Buffer,
  filename: string,
  mimetype?: string
): Promise<{ id: any; filename: string }> {
  return new Promise((resolve, reject) => {
    if (!bucket) return reject(new Error('GridFS bucket no inicializado'));

    const uploadStream = bucket.openUploadStream(filename, { contentType: mimetype });

    uploadStream.once('error', reject);
    uploadStream.once('finish', () => {
      resolve({ id: uploadStream.id, filename: uploadStream.filename });
    });

    uploadStream.end(buffer);
  });
}


export async function deleteGridFSFile(id: string) {
  const bucket = getBucket();
  await bucket.delete(new mongoose.Types.ObjectId(id));
}
