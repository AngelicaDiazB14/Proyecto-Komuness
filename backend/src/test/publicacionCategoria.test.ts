// src/test/publicacionCategoria.test.ts
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { connectBD } from '../utils/mongodb';

describe('Crear Publicación con Categoría', () => {
    beforeAll(async () => {
        // Conectar a la BD de pruebas
        await connectBD(process.env.BD_URL || 'mongodb://localhost:27017/testdb');
    });

    afterAll(async () => {
        // Cerrar la conexión
        await mongoose.connection.close();
    });

    const testPublicacion = {
        titulo: 'Publicacion con Categoria',
        contenido: 'Contenido de prueba con categoría',
        fecha: new Date(),
        autor: new mongoose.Types.ObjectId('67da43f3651480413241b33c'), // reemplazar con autor válido
        tag: 'test',
        adjunto: [],
        comentarios: [],
        publicado: false,
        categoria: new mongoose.Types.ObjectId('68b5f552cfdb8715f11011dc'), // categoría "Danza"
    };

    test('POST /publicaciones - Crear publicación con categoría', async () => {
        const response = await request(app)
            .post('/api/publicaciones')
            .send(testPublicacion);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('_id');
        expect(response.body).toHaveProperty('categoria');
        expect(response.body.categoria).toBe('68b5f552cfdb8715f11011dc');

        // Limpiar: eliminar la publicación creada
        const responseDelete = await request(app)
            .delete(`/api/publicaciones/${response.body._id}`)

    });
});
