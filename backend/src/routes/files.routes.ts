// backend/src/routes/files.routes.ts
import { Router, type RequestHandler } from "express";
import mongoose from "mongoose";

const router = Router();

const getFile: RequestHandler = async (req, res) => {
  const { id } = req.params;

  // validar ObjectId
  let _id: mongoose.Types.ObjectId;
  try {
    _id = new mongoose.Types.ObjectId(id);
  } catch {
    res.status(400).json({ message: "ID de archivo inválido" });
    return;
  }

  const db = mongoose.connection.db;
  if (!db) {
    res.status(500).json({ message: "DB no inicializada" });
    return;
  }

  // buscar metadatos (para headers)
  const fileDoc = await db.collection("uploads.files").findOne({ _id });
  if (!fileDoc) {
    res.status(404).json({ message: "Archivo no encontrado" });
    return;
  }

  const contentType =
    // @ts-ignore
    fileDoc.contentType || fileDoc?.metadata?.contentType || "application/octet-stream";
  // @ts-ignore
  const length = fileDoc.length;
  // @ts-ignore
  const filename = fileDoc.filename;

  res.setHeader("Content-Type", contentType);
  if (length) res.setHeader("Content-Length", String(length));
  if (filename) res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.setHeader("Cache-Control", "public, max-age=604800"); // 7d

  // GridFSBucket desde mongoose
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bucket = new (mongoose as any).mongo.GridFSBucket(db, { bucketName: "uploads" });

  const stream = bucket.openDownloadStream(_id);
  stream.on("error", () => res.status(404).end());
  stream.pipe(res);
};

router.get("/:id", getFile);

export default router;
