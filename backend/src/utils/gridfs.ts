import mongoose from 'mongoose';

let bucket: mongoose.mongo.GridFSBucket | null = null;

function getBucket() {
  if (!bucket) {
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB no está conectado');
    bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
  }
  return bucket!;
}

export async function uploadBufferToGridFS(file: Express.Multer.File, carpeta = 'publicaciones') {
  const filename = `${carpeta}/${Date.now()}-${file.originalname}`;
  const contentType = file.mimetype;

  const bucket = getBucket();
  const uploadStream = bucket.openUploadStream(filename, {
    contentType,
    metadata: { originalname: file.originalname, carpeta },
  });

  uploadStream.end(file.buffer);

  return await new Promise<{ id: mongoose.Types.ObjectId; filename: string; contentType: string }>((resolve, reject) => {
    uploadStream.on('finish', (f: any) =>
      resolve({ id: f._id as mongoose.Types.ObjectId, filename: f.filename as string, contentType }),
    );
    uploadStream.on('error', reject);
  });
}

export async function deleteGridFSFile(id: string) {
  const bucket = getBucket();
  await bucket.delete(new mongoose.Types.ObjectId(id));
}

export function saveBufferToGridFS(
  buffer: Buffer,
  filename: string,
  mimetype?: string
): Promise<{ id: any; filename: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimetype,
    });

    uploadStream.once('error', reject);

    // 'finish' NO recibe parámetros. Usa uploadStream.id
    uploadStream.once('finish', () => {
      resolve({ id: uploadStream.id, filename: uploadStream.filename });
    });

    uploadStream.end(buffer);
  });
}
