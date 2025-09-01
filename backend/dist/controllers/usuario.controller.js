"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAuth = exports.registerUsuario = exports.loginUsuario = exports.deleteUsuario = exports.updateUsuario = exports.getUsuarioById = exports.getUsuarios = exports.createUsuario = void 0;
exports.enviarCorreoRecuperacion = enviarCorreoRecuperacion;
const usuario_model_1 = require("../models/usuario.model");
const jwt_1 = require("../utils/jwt");
const bcryptjs_1 = require("../utils/bcryptjs");
const nodemailer_1 = require("nodemailer");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
//const nodemailer = require('nodemailer');
// Controlador para crear un usuario
const createUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const usuario = req.body;
        const user = new usuario_model_1.modelUsuario(usuario);
        const saveuser = yield user.save();
        res.status(201).json(saveuser);
    }
    catch (error) {
        const err = error;
        res.status(500).json({ message: err.message });
    }
});
exports.createUsuario = createUsuario;
// Controlador para obtener todos los usuarios
const getUsuarios = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tipoUsuario } = req.query;
    const query = {};
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
        const usuarios = yield usuario_model_1.modelUsuario.find(query);
        res.status(200).json(usuarios);
    }
    catch (error) {
        const err = error;
        console.log(`Error en ${exports.getUsuarios.name}: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.getUsuarios = getUsuarios;
// Controlador para obtener un usuario por su id
const getUsuarioById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const usuario = yield usuario_model_1.modelUsuario.findById(id);
        res.status(200).json(usuario);
    }
    catch (error) {
        const err = error;
        res.status(500).json({ message: err.message });
    }
});
exports.getUsuarioById = getUsuarioById;
// Controlador para actualizar un usuario
const updateUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const usuario = req.body;
        // If password is included in the update, hash it before saving
        if (usuario.password) {
            usuario.password = yield (0, bcryptjs_1.hashPassword)(usuario.password);
        }
        const user = yield usuario_model_1.modelUsuario.findByIdAndUpdate(id, usuario, { new: true });
        res.status(200).json(user);
    }
    catch (error) {
        const err = error;
        res.status(500).json({ message: err.message });
    }
});
exports.updateUsuario = updateUsuario;
// Controlador para eliminar un usuario
const deleteUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        yield usuario_model_1.modelUsuario.findByIdAndDelete(id);
        res.status(200).json({ message: 'Usuario eliminado' });
    }
    catch (error) {
        const err = error;
        res.status(500).json({ message: err.message });
    }
});
exports.deleteUsuario = deleteUsuario;
/**
 *
 * loginUsuario: realiza el login de un usuario y devuelve un token
 * @param req: Request
 * @param res: Response
 * @returns: void
 */
const loginUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        //buscamos el usuario en la base de datos
        const usuario = yield usuario_model_1.modelUsuario.findOne({ email });
        if (!usuario) {
            res.status(401).json({ message: 'Usuario no encontrado' });
            return;
        }
        //comparamos la contraseña
        const isPasswordValid = yield (0, bcryptjs_1.comparePassword)(password, usuario.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Contraseña incorrecta' });
            return;
        }
        //si es exitoso, generamos un token y lo devolvemos en la cookie
        const token = (0, jwt_1.generarToken)(usuario);
        // res.cookie('token',
        //     token,
        //     {
        //         httpOnly: true,
        //         secure: process.env.NODE_ENV === "production",
        //     }
        // );
        res.status(200).json({ token, message: 'Login exitoso', user: usuario });
    }
    catch (error) {
        const err = error;
        console.log(err);
        res.status(500).json({ message: err.message });
    }
});
exports.loginUsuario = loginUsuario;
/**
 *
 * registerUsuario: registra un usuario en la base de datos
 * @param req: Request
 * @param res: Response
 * @returns: void
 */
const registerUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nombre, apellido, email, password, tipoUsuario, codigo } = req.body;
    try {
        //verificamos si el usuario ya existe
        const usuario = yield usuario_model_1.modelUsuario.findOne({ email });
        if (usuario) {
            res.status(400).json({ message: 'Usuario ya existe' });
            return;
        }
        //si no existe, lo creamos
        const hashedPassword = yield (0, bcryptjs_1.hashPassword)(password);
        const newUsuario = new usuario_model_1.modelUsuario({
            nombre,
            apellido,
            email,
            password: hashedPassword,
            tipoUsuario,
            codigo
        });
        yield newUsuario.save();
        res.status(201).json({ message: 'Usuario creado', user: newUsuario });
    }
    catch (error) {
        const err = error;
        console.log(err);
        res.status(500).json({ message: err.message });
    }
});
exports.registerUsuario = registerUsuario;
/**
 * checkAuth: verifica si el usuario esta autenticado en la aplicacion
 * @param req: Request
 * @param res: Response
 * @returns: void
 */
const checkAuth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const status = yield (0, jwt_1.verificarToken)(token);
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
    }
    catch (error) {
        const err = error;
        console.log(err);
        res.status(500).json({ message: err.message });
    }
});
exports.checkAuth = checkAuth;
function enviarCorreoRecuperacion(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email } = req.body;
        // setup del transporter de nodemailer para enviar correos 
        const transporter = (0, nodemailer_1.createTransport)({
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
        const hashedPassword = yield (0, bcryptjs_1.hashPassword)(newPassword);
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
            const usuario = yield usuario_model_1.modelUsuario.findOne({ email });
            if (!usuario) {
                res.status(404).json({ message: 'Usuario no encontrado' });
                throw new Error('Usuario no encontrado');
            }
            else {
                yield transporter.sendMail(mailOptions);
                yield usuario_model_1.modelUsuario.findOneAndUpdate({ email }, { password: hashedPassword });
                res.status(200).json({ message: 'Correo electrónico enviado con éxito' });
            }
        }
        catch (error) {
            console.error('Error al enviar el correo electrónico:', error);
        }
    });
}
