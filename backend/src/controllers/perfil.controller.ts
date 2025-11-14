import { Request, Response } from 'express';
import { modelPerfil } from '../models/perfil.model';
import { modelUsuario } from '../models/usuario.model';
import fs from 'fs';
import path from 'path';

/**
 * Obtener perfil público de un usuario por ID
 * @route GET /api/perfil/:id
 */
export const obtenerPerfilPublico = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { modo } = req.query;

    const perfil = await modelPerfil.findOne({ usuarioId: id }).populate('usuarioId', 'nombre apellido email');

    if (!perfil) {
      res.status(404).json({ message: 'Perfil no encontrado' });
      return;
    }

    // Verificar si el perfil es público
    if (!perfil.perfilPublico) {
      res.status(403).json({ message: 'Este perfil no es público' });
      return;
    }

    // Si modo=basico, retornar solo información básica
    if (modo === 'basico') {
      const perfilBasico = {
        _id: perfil._id,
        usuarioId: perfil.usuarioId,
        nombre: perfil.nombre,
        apellidos: perfil.apellidos,
        fotoPerfil: perfil.fotoPerfil,
        ocupacionPrincipal: perfil.ocupacionPrincipal,
        especialidad: perfil.especialidad,
        provincia: perfil.provincia,
        canton: perfil.canton
      };
      res.status(200).json({ data: perfilBasico });
      return;
    }

    // Retornar perfil completo
    const perfilCompleto = perfil.toObject();

    res.status(200).json({ data: perfilCompleto });
  } catch (error) {
    console.error('Error en obtenerPerfilPublico:', error);
    res.status(500).json({
      message: 'Error al obtener el perfil',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener mi perfil completo (usuario autenticado)
 * @route GET /api/perfil/usuario/me
 */
export const obtenerMiPerfil = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    let perfil = await modelPerfil.findOne({ usuarioId: userId }).populate('usuarioId', 'nombre apellido email');

    // Si no existe perfil, crear uno vacío
    if (!perfil) {
      const usuario = await modelUsuario.findById(userId);
      if (!usuario) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }

      perfil = await modelPerfil.create({
        usuarioId: userId,
        nombre: usuario.nombre,
        apellidos: usuario.apellido,
        formacionAcademica: [],
        experienciaLaboral: [],
        habilidades: [],
        proyectos: [],
        redesSociales: {}
      });
    }

    res.status(200).json({ data: perfil });
  } catch (error) {
    console.error('Error en obtenerMiPerfil:', error);
    res.status(500).json({
      message: 'Error al obtener el perfil',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Crear o actualizar perfil completo
 * @route POST /api/perfil
 */
export const crearOActualizarPerfil = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const datosActualizados = req.body;

    // Verificar que el usuario existe
    const usuario = await modelUsuario.findById(userId);
    if (!usuario) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Buscar perfil existente
    let perfil = await modelPerfil.findOne({ usuarioId: userId });

    if (perfil) {
      // Actualizar perfil existente
      Object.assign(perfil, datosActualizados);
      await perfil.save();
    } else {
      // Crear nuevo perfil
      perfil = await modelPerfil.create({
        usuarioId: userId,
        ...datosActualizados
      });
    }

    res.status(200).json({ 
      message: 'Perfil actualizado exitosamente',
      data: perfil 
    });
  } catch (error) {
    console.error('Error en crearOActualizarPerfil:', error);
    res.status(500).json({
      message: 'Error al actualizar el perfil',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Subir foto de perfil
 * @route PUT /api/perfil/foto
 */
export const subirFotoPerfil = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    if (!req.file) {
      res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
      return;
    }

    // Buscar o crear perfil
    let perfil = await modelPerfil.findOne({ usuarioId: userId });
    
    if (!perfil) {
      perfil = await modelPerfil.create({
        usuarioId: userId,
        formacionAcademica: [],
        experienciaLaboral: [],
        habilidades: [],
        proyectos: [],
        redesSociales: {}
      });
    }

    // Eliminar foto anterior si existe
    if (perfil.fotoPerfil) {
      const rutaAnterior = path.join(__dirname, '..', perfil.fotoPerfil);
      if (fs.existsSync(rutaAnterior)) {
        fs.unlinkSync(rutaAnterior);
      }
    }

    // Guardar nueva ruta (relativa)
    const rutaRelativa = `/tmp/uploads/perfiles/fotos/${req.file.filename}`;
    perfil.fotoPerfil = rutaRelativa;
    await perfil.save();

    res.status(200).json({ 
      message: 'Foto de perfil actualizada exitosamente',
      fotoPerfil: rutaRelativa
    });
  } catch (error) {
    console.error('Error en subirFotoPerfil:', error);
    res.status(500).json({
      message: 'Error al subir la foto de perfil',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Subir CV
 * @route PUT /api/perfil/cv
 */
export const subirCV = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    if (!req.file) {
      res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      return;
    }

    // Buscar o crear perfil
    let perfil = await modelPerfil.findOne({ usuarioId: userId });
    
    if (!perfil) {
      perfil = await modelPerfil.create({
        usuarioId: userId,
        formacionAcademica: [],
        experienciaLaboral: [],
        habilidades: [],
        proyectos: [],
        redesSociales: {}
      });
    }

    // Eliminar CV anterior si existe
    if (perfil.cvUrl) {
      const rutaAnterior = path.join(__dirname, '..', perfil.cvUrl);
      if (fs.existsSync(rutaAnterior)) {
        fs.unlinkSync(rutaAnterior);
      }
    }

    // Guardar nueva ruta (relativa)
    const rutaRelativa = `/tmp/uploads/perfiles/cvs/${req.file.filename}`;
    perfil.cvUrl = rutaRelativa;
    await perfil.save();

    res.status(200).json({ 
      message: 'CV subido exitosamente',
      cvUrl: rutaRelativa
    });
  } catch (error) {
    console.error('Error en subirCV:', error);
    res.status(500).json({
      message: 'Error al subir el CV',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Eliminar CV
 * @route DELETE /api/perfil/cv
 */
export const eliminarCV = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    const perfil = await modelPerfil.findOne({ usuarioId: userId });
    
    if (!perfil) {
      res.status(404).json({ message: 'Perfil no encontrado' });
      return;
    }

    if (!perfil.cvUrl) {
      res.status(404).json({ message: 'No hay CV para eliminar' });
      return;
    }

    // Eliminar archivo físico
    const rutaArchivo = path.join(__dirname, '..', perfil.cvUrl);
    if (fs.existsSync(rutaArchivo)) {
      fs.unlinkSync(rutaArchivo);
    }

    // Actualizar perfil
    perfil.cvUrl = undefined;
    await perfil.save();

    res.status(200).json({ message: 'CV eliminado exitosamente' });
  } catch (error) {
    console.error('Error en eliminarCV:', error);
    res.status(500).json({
      message: 'Error al eliminar el CV',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Actualizar correo principal del usuario
 * @route PUT /api/perfil/correo-principal
 */
export const actualizarCorreoPrincipal = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'El correo es requerido' });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: 'Formato de correo inválido' });
      return;
    }

    // Verificar que el correo no esté en uso
    const emailExistente = await modelUsuario.findOne({ email, _id: { $ne: userId } });
    if (emailExistente) {
      res.status(400).json({ message: 'El correo ya está en uso por otro usuario' });
      return;
    }

    // Actualizar correo
    const usuario = await modelUsuario.findByIdAndUpdate(
      userId,
      { email },
      { new: true }
    );

    if (!usuario) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.status(200).json({ 
      message: 'Correo actualizado exitosamente',
      email: usuario.email
    });
  } catch (error) {
    console.error('Error en actualizarCorreoPrincipal:', error);
    res.status(500).json({
      message: 'Error al actualizar el correo',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
