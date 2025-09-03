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

export async function uploadBufferToGridFS(file: Express.Multer.File, carpeta = 'publicaciones') {
  const filename = `${carpeta}/${Date.now()}-${file.originalname}`;
  const contentType = file.mimetype;

  const bucket = getBucket();
  const uploadStream = bucket.openUploadStream(filename, {
    contentType,
    metadata: { originalname: file.originalname, carpeta },
  });

  return await new Promise<{ id: mongoose.Types.ObjectId; filename: string; contentType: string }>((resolve, reject) => {
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      // ⬇️ el id se toma del stream, no del parámetro del evento
      resolve({
        id: uploadStream.id as mongoose.Types.ObjectId,
        filename,
        contentType,
      });
    });
    uploadStream.end(file.buffer);
  });
}

export async function deleteGridFSFile(id: string) {
  const bucket = getBucket();
  await bucket.delete(new mongoose.Types.ObjectId(id));
}
