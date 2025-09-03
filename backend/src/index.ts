import express, { Request, Response, Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectBD } from './utils/mongodb';
import usuarioRoutes from './routes/usuario.routes';
import publicacionRoutes from './routes/publicaciones.routes';
import bibliotecaRoutes from './routes/biblioteca.routes';
import categoriaRoutes from "./routes/categoria.routes";//importación de rutas para categoría
import { sendEmail } from './utils/mail';
import filesRouter from './routes/files.routes';
import cookieParser from 'cookie-parser';

const app: Express = express();
dotenv.config();

app.disable('x-powered-by');
app.use(cookieParser())
app.use(express.json());
app.use(cors(
    {
        origin: [
            'http://localhost:3001',
            'http://localhost:3000',
            'https://proyecto-komuness-front.vercel.app',
            'https://komuness-project.netlify.app',
            'http://64.23.137.192'
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
));

//routes
app.use('/api/usuario', usuarioRoutes);
app.use('/api/publicaciones', publicacionRoutes);
app.use('/api/biblioteca', bibliotecaRoutes);
app.use("/api/categorias", categoriaRoutes); // nueva ruta para categorías
app.use('/api', filesRouter);

app.get('/api/', (req: Request, res: Response) => {
    res.send('Hello World');
});

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
