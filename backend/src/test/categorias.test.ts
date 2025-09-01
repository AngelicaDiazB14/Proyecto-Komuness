import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { modelCategoria } from '../models/categoria.model';

dotenv.config();

async function main() {
    await mongoose.connect(process.env.BD_URL!);
    console.log('Conectado a MongoDB para pruebas');

    // Crear una categoría de prueba
    const categoria = new modelCategoria({ nombre: 'Danza' });
    await categoria.save();
    console.log('Categoría creada:', categoria);

    // Listar todas las categorías
    const categorias = await modelCategoria.find();
    console.log('Todas las categorías en la base de datos:', categorias);

    // Cerrar conexión
    await mongoose.disconnect();
    console.log(' Desconectado de MongoDB');
}

main().catch(console.error);
