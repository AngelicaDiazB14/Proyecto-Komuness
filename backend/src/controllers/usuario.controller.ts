import { Request, Response } from 'express';
import { IUsuario, IUsuario as Usuario } from '../interfaces/usuario.interface';
import { modelUsuario } from '../models/usuario.model';
import { generarToken, verificarToken } from '../utils/jwt';
import { hashPassword, comparePassword } from '../utils/bcryptjs';
import { createTransport } from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
//const nodemailer = require('nodemailer');


// Controlador para crear un usuario
export const createUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
        const usuario: Usuario = req.body;
        const user = new modelUsuario(usuario);
        const saveuser = await user.save();
        res.status(201).json(saveuser);
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ message: err.message });
    }
};

// Controlador para obtener todos los usuarios
export const getUsuarios = async (req: Request, res: Response): Promise<void> => {
    const { tipoUsuario } = req.query;

    const query: any = {};

    if (tipoUsuario) {
        // Convertir a array de números
        const tipos = String(tipoUsuario).split(',').map(Number);

        // Validar que todos sean números
        if (tipos.some(isNaN)) {
            res.status(400).json({
                success: false,
                message: 'tipoUsuario debe contener números separados por comas'
            });
            return;
        }

        query.tipoUsuario = { $in: tipos };
    }

    try {
        const usuarios = await modelUsuario.find(query);
        res.status(200).json(usuarios);
    } catch (error) {
        const err = error as Error;
        console.log(`Error en ${getUsuarios.name}: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Controlador para obtener un usuario por su id
export const getUsuarioById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id;
        const usuario = await modelUsuario.findById(id);
        res.status(200).json(usuario);
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ message: err.message });
    }
};

// Controlador para actualizar un usuario
export const updateUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id;
        const usuario: Partial<Usuario> = req.body;

        // If password is included in the update, hash it before saving
        if (usuario.password) {
            usuario.password = await hashPassword(usuario.password);
        }
        const user = await modelUsuario.findByIdAndUpdate(id, usuario, { new: true });
        res.status(200).json(user);
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ message: err.message });
    }
};

// Controlador para eliminar un usuario
export const deleteUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id;
        await modelUsuario.findByIdAndDelete(id);
        res.status(200).json({ message: 'Usuario eliminado' });
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ message: err.message });
    }
};

/**
 * 
 * loginUsuario: realiza el login de un usuario y devuelve un token
 * @param req: Request
 * @param res: Response
 * @returns: void
 */
export const loginUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        //buscamos el usuario en la base de datos
        const usuario = await modelUsuario.findOne({ email });
        if (!usuario) {
            res.status(401).json({ message: 'Usuario no encontrado' });
            return;
        }
        //comparamos la contraseña
        const isPasswordValid = await comparePassword(password, usuario.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Contraseña incorrecta' });
            return;
        }
        //si es exitoso, generamos un token y lo devolvemos en la cookie
        const token = generarToken(usuario);
        // res.cookie('token',
        //     token,
        //     {
        //         httpOnly: true,
        //         secure: process.env.NODE_ENV === "production",
        //     }
        // );
        res.status(200).json({ token, message: 'Login exitoso', user: usuario });
    } catch (error) {
        const err = error as Error;
        console.log(err);
        res.status(500).json({ message: err.message });
    }
}

/**
 * 
 * registerUsuario: registra un usuario en la base de datos
 * @param req: Request
 * @param res: Response
 * @returns: void
 */
export const registerUsuario = async (req: Request, res: Response): Promise<void> => {
    const { nombre, apellido, email, password, tipoUsuario, codigo } = req.body;
    try {
        //verificamos si el usuario ya existe
        const usuario = await modelUsuario.findOne({ email });
        if (usuario) {
            res.status(400).json({ message: 'Usuario ya existe' });
            return;
        }
        //si no existe, lo creamos
        const hashedPassword = await hashPassword(password);
        const newUsuario = new modelUsuario({
            nombre,
            apellido,
            email,
            password: hashedPassword,
            tipoUsuario,
            codigo
        });
        await newUsuario.save();
        res.status(201).json({ message: 'Usuario creado', user: newUsuario });
    } catch (error) {
        const err = error as Error;
        console.log(err);
        res.status(500).json({ message: err.message });
    }
}

/**
 * checkAuth: verifica si el usuario esta autenticado en la aplicacion
 * @param req: Request
 * @param res: Response
 * @returns: void
 */
export const checkAuth = async (req: Request, res: Response): Promise<void> => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            res.status(401).json({ message: 'No provee Bearer header' });
            return;
        }
        const token = header.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'No provee token' });
            return;
        }
        //verificamos el token
        const status = await verificarToken(token);
        if (!status.usuario) {
            if (status.error === "Token expirado") {
                res.status(401).json({ message: 'Token expirado' });
                return;
            }
            if (status.error === "Token invalido") {
                res.status(403).json({ message: 'Token invalido' });
                return;

            }
            res.status(401).json({ message: 'No autorizado' });
            return;
        }
        res.status(200).json({ message: 'Autorizado', user: status.usuario });
    } catch (error) {
        const err = error as Error;
        console.log(err);
        res.status(500).json({ message: err.message });
    }
}

export async function enviarCorreoRecuperacion(req: Request, res: Response): Promise<void> {

    const { email } = req.body;

    // setup del transporter de nodemailer para enviar correos 
    const transporter = createTransport({
        service: 'zoho',
        host: 'smtp.zoho.com',
        port: 2525,
        secure: false,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    // Generar una nueva contraseña aleatoria
    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(newPassword);

    // opciones del correo electrónico con la nueva contraseña
    const mailOptions = {
        from: 'komuness@zohomail.com',
        to: email,
        subject: 'Recuperación de contraseña',
        html: `
            <p>Has solicitado restablecer tu contraseña.</p>
            <p>La nueva contraseña para el ingreso a su cuenta será:</p>
            <p>${newPassword}</p>
        `
    };

    // Enviar el correo electrónico y actualizar la contraseña en la base de datos
    try {
        const usuario = await modelUsuario.findOne({ email });
        if (!usuario) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            throw new Error('Usuario no encontrado');
        } else {
            await transporter.sendMail(mailOptions);
            await modelUsuario.findOneAndUpdate(
                { email },
                { password: hashedPassword }
            );
            res.status(200).json({ message: 'Correo electrónico enviado con éxito' });
        }
    } catch (error) {
        console.error('Error al enviar el correo electrónico:', error);
    }
}

/**
 * Actualizar límite personalizado de publicaciones para un usuario específico (solo admins)
 */
export const actualizarLimiteUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { limitePublicaciones } = req.body;

        if (limitePublicaciones !== undefined && limitePublicaciones !== null) {
            if (typeof limitePublicaciones !== 'number' || limitePublicaciones < 0) {
                res.status(400).json({
                    success: false,
                    message: 'limitePublicaciones debe ser un número mayor o igual a 0'
                });
                return;
            }
        }

        const usuario = await modelUsuario.findByIdAndUpdate(
            id,
            { limitePublicaciones },
            { new: true }
        ).select('-password');

        if (!usuario) {
            res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Límite personalizado actualizado correctamente',
            data: usuario
        });
    } catch (error) {
        const err = error as Error;
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * Actualizar fecha de vencimiento premium para un usuario (solo admins)
 */
export const actualizarVencimientoPremium = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { fechaVencimientoPremium } = req.body;

        if (!fechaVencimientoPremium) {
            res.status(400).json({
                success: false,
                message: 'Se requiere la fecha de vencimiento'
            });
            return;
        }

        const usuario = await modelUsuario.findByIdAndUpdate(
            id,
            { 
                fechaVencimientoPremium: new Date(fechaVencimientoPremium),
                tipoUsuario: 3 // Asegurar que sea premium
            },
            { new: true }
        ).select('-password');

        if (!usuario) {
            res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Fecha de vencimiento premium actualizada correctamente',
            data: usuario
        });
    } catch (error) {
        const err = error as Error;
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Activar premium para el usuario actualmente autenticado
export const activarPremiumActual = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as any;
        const loggedUserId =
            authReq.user?._id?.toString?.() ||
            authReq.user?._id ||
            authReq.userId ||
            authReq.user?.id;

        if (!loggedUserId) {
            res.status(401).json({
                success: false,
                message: 'Usuario no autenticado',
            });
            return;
        }

        const usuario = await modelUsuario.findByIdAndUpdate(
            loggedUserId,
            { tipoUsuario: 3 }, 
            { new: true }
        ).select('-password');

        if (!usuario) {
            res.status(404).json({
                success: false,
                message: 'Usuario no encontrado',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Usuario actualizado a Premium',
            data: usuario,
        });
    } catch (error) {
        const err = error as Error;
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

