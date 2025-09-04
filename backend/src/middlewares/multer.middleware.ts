import fs from "node:fs";
import path from "node:path";
import multer from "multer";

/* ============= utilidades ============= */
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function safeBase(name: string, ext: string) {
  return path.basename(name, ext).replace(/[^a-zA-Z0-9._-]+/g, "_");
}
function sanitizeSubdir(v: unknown) {
  if (!v) return "";
  return String(v).replace(/\.\./g, "").replace(/[^a-zA-Z0-9/_-]/g, "_");
}

/* ============= storage general ============= */
const generalBase =
  process.env.NODE_ENV === "production"
    ? "/srv/uploads"
    : path.join(__dirname, "../tmp/uploads");

const storageGeneral = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureDir(generalBase);
    cb(null, generalBase);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = safeBase(file.originalname, ext);
    const uniq = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${base}-${uniq}${ext}`);
  },
});

/** Middleware genérico (no Biblioteca) */
export const upload = multer({ storage: storageGeneral });

/* ============= storage para Biblioteca (disco de la VM) ============= */
/**
 * Raíz de biblioteca en producción:
 *   - por defecto: /var/komuness/library
 *   - configurable con: BIBLIOTECA_ROOT=/otro/camino
 * En dev usa `../tmp/library`.
 */
const bibliotecaRoot =
  process.env.BIBLIOTECA_ROOT ||
  (process.env.NODE_ENV === "production"
    ? "/var/komuness/library"
    : path.join(__dirname, "../tmp/library"));

const storageBiblioteca = multer.diskStorage({
  destination: (req, _file, cb) => {
    // opcional: guardar por carpeta lógica (folderId)
    const sub = sanitizeSubdir((req.body as any)?.folderId) || "root";
    const dest = path.join(bibliotecaRoot, sub);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = safeBase(file.originalname, ext);
    const uniq = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${base}-${uniq}${ext}`);
  },
});

/** Middleware específico para Biblioteca */
export const uploadBiblioteca = multer({
  storage: storageBiblioteca,
});
