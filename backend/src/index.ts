// src/app.ts
import express, { Request, Response, Express } from 'express';
import type { ErrorRequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectBD } from './utils/mongodb';
import usuarioRoutes from './routes/usuario.routes';
import publicacionRoutes from './routes/publicaciones.routes';
import bibliotecaRoutes from './routes/biblioteca.routes';
import categoriaRoutes from "./routes/categoria.routes"; //importación de rutas para categoría
import configuracionRoutes from "./routes/configuracion.routes"; //importación de rutas para configuración
import { sendEmail } from './utils/mail';
import filesRouter from './routes/files.routes';
import cookieParser from 'cookie-parser';
import seccionAcercaRoutes from './routes/seccionAcerca.routes';
import perfilRoutes from './routes/perfil.routes';
import path from 'path';

// 👇👇 NUEVO: importar las rutas de PayPal
import paypalRoutes from './routes/paypal.routes';

const app: Express = express();
dotenv.config();

app.disable('x-powered-by');
app.use(cookieParser());
app.use(express.json());
app.use(cors(
    {
        origin: [
            'http://localhost:3001',
            'http://localhost:3000',
            'https://proyecto-komuness-front.vercel.app',
            'https://komuness-project.netlify.app',
            'http://64.23.137.192',
            'http://159.54.148.238',
            'https://komuness.duckdns.org' 
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
));

// Rutas API
app.use('/api/usuario', usuarioRoutes);
app.use('/api/publicaciones', publicacionRoutes);
app.use('/api/biblioteca', bibliotecaRoutes);
app.use("/api/categorias", categoriaRoutes); // nueva ruta para categorías
app.use("/api/configuracion", configuracionRoutes); // nueva ruta para configuración de límites
app.use('/api', filesRouter);
app.use('/api/acerca-de', seccionAcercaRoutes);
app.use('/api/perfil', perfilRoutes); // nueva ruta para perfiles de usuario
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));
app.use('/tmp', express.static(path.join(__dirname, '..', 'src', 'tmp'))); // Archivos temporales de perfil

// 👇👇 NUEVO: montar PayPal bajo /api/paypal
app.use('/api/paypal', paypalRoutes);

app.get('/api/', (req: Request, res: Response) => {
    res.send('Hello World');
});

// Middleware global de errores
const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    // Multer file too large
    if (err && (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_PART_COUNT' || err.code === 'LIMIT_FILE_COUNT')) {
        res.status(413).json({
            success: false,
            message: `El archivo excede el límite permitido de ${(process.env.LIBRARY_MAX_FILE_SIZE_MB || '200')} MB.`,
            errorCode: err.code || 'LIMIT_EXCEEDED'
        });
        return;
    }

    // 413 genérico
    if (err && err.status === 413) {
        res.status(413).json({
            success: false,
            message: `Payload demasiado grande. Asegúrate que los archivos no superen ${(process.env.LIBRARY_MAX_FILE_SIZE_MB || '200')} MB.`,
        });
        return;
    }

    // errores de conexión comunes al subir archivos
    if (err && (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT')) {
        res.status(502).json({
            success: false,
            message: 'Hubo un problema de conexión durante la carga. Intenta nuevamente.',
            errorCode: err.code
        });
        return;
    }

    // si no es un error controlado
    if (err) {
        console.error('Unhandled error middleware:', err);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
        return;
    }
    return;
};

app.use(globalErrorHandler);

const port = process.env.PORT || 5000;

// Conexión a MongoDB y exportación
(async () => {
    await connectBD(process.env.BD_URL!);
    console.log("✅ MongoDB conectado");
})();

export default app;

// esto es para que no se ejecute el server al importarlo en otro archivo
if (require.main === module) {
    connectBD(process.env.BD_URL || '').then(() => {
        console.log('Connected to MongoDB');
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    });
}
