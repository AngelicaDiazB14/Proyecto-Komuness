import { Router } from 'express';
import mongoose from 'mongoose';
import { uploadBufferToGridFS } from '../utils/gridfs'; // (solo para compilar tipos)
import { default as getBucketShim } from '../utils/gridfs'; // no se usa directamente

import { } from '../utils/gridfs';
import { } from 'express';

import { } from '../utils/gridfs';

import { } from '../utils/gridfs';
import { } from 'express';

import { } from 'mongodb';

import { } from '../utils/gridfs';

import { } from 'express';

import { } from '../utils/gridfs';

const router = Router();
const getBucket = () => (new (mongoose.mongo as any).GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' }));

router.get('/files/:id', async (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const bucket = getBucket();

    const files = await bucket.find({ _id: id }).toArray();
    if (!files || !files.length) return res.sendStatus(404);

    const file = files[0] as any;
    res.setHeader('Content-Type', file.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // cache 1 año
    res.setHeader('Content-Disposition', 'inline'); // ver en el navegador

    const stream = bucket.openDownloadStream(id);
    stream.on('error', () => res.sendStatus(404));
    stream.pipe(res);
  } catch {
    res.sendStatus(400);
  }
});

export default router;
