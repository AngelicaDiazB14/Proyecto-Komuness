import { Router, RequestHandler } from 'express';
import mongoose from 'mongoose';

const router = Router();

function getBucket(): mongoose.mongo.GridFSBucket {
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB no está conectado');
  return new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
}

const getFileHandler: RequestHandler = async (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const bucket = getBucket();

    const files = await bucket.find({ _id: id }).toArray();
    if (!files || files.length === 0) {
      res.sendStatus(404);
      return;
    }

    const file: any = files[0];
    if (file.contentType) res.setHeader('Content-Type', file.contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Disposition', 'inline');

    const stream = bucket.openDownloadStream(id);
    stream.on('error', () => res.sendStatus(404));
    stream.pipe(res);
  } catch {
    res.sendStatus(400);
  }
};

router.get('/files/:id', getFileHandler);

export default router;
