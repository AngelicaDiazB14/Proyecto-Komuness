import { Request, Response, NextFunction } from 'express';
import { IUsuario } from '../interfaces/usuario.interface';
import { modelPublicacion } from '../models/publicacion.model';
import { modelConfiguracion } from '../models/configuracion.model';
import { modelUsuario } from '../models/usuario.model';

/**
 * Middleware para validar si un usuario ha alcanzado su límite de publicaciones
 * Debe ejecutarse después del authMiddleware
 */
export const validarLimitePublicaciones = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Obtener el usuario autenticado del request
        const user = (req as Request & { user?: IUsuario }).user;

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
            return;
        }

        // Super-admin y admin no tienen límites
        if (user.tipoUsuario === 0 || user.tipoUsuario === 1) {
            next();
            return;
        }

        // Obtener el usuario completo de la base de datos para tener datos actualizados
        const usuarioCompleto = await modelUsuario.findById(user._id);

        if (!usuarioCompleto) {
            res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
            return;
        }

        // Validar si es usuario premium y si ha expirado su suscripción
        if (usuarioCompleto.tipoUsuario === 3) {
            if (usuarioCompleto.fechaVencimientoPremium) {
                const ahora = new Date();
                const vencimiento = new Date(usuarioCompleto.fechaVencimientoPremium);

                if (ahora > vencimiento) {
                    res.status(403).json({
                        success: false,
                        message: 'Tu suscripción premium ha expirado. Por favor, renueva tu suscripción para continuar publicando.',
                        fechaVencimiento: vencimiento
                    });
                    return;
                }
            }
        }

        // Obtener el límite aplicable para este usuario
        let limiteAplicable: number;

        // 1. Si el usuario tiene un límite personalizado, usarlo
        if (usuarioCompleto.limitePublicaciones !== undefined && usuarioCompleto.limitePublicaciones !== null) {
            limiteAplicable = usuarioCompleto.limitePublicaciones;
        } else {
            // 2. Obtener límite global según tipo de usuario
            const claveConfiguracion = usuarioCompleto.tipoUsuario === 3
                ? 'limite_publicaciones_premium'
                : 'limite_publicaciones_basico';

            const configuracion = await modelConfiguracion.findOne({ clave: claveConfiguracion });

            if (configuracion && typeof configuracion.valor === 'number') {
                limiteAplicable = configuracion.valor;
            } else {
                // Límites por defecto si no hay configuración
                limiteAplicable = usuarioCompleto.tipoUsuario === 3 ? 50 : 10;
            }
        }

        // Contar publicaciones del usuario
        const cantidadPublicaciones = await modelPublicacion.countDocuments({
            autor: usuarioCompleto._id
        });

        // Validar si ha alcanzado el límite
        if (cantidadPublicaciones >= limiteAplicable) {
            res.status(403).json({
                success: false,
                message: `Has alcanzado el límite de ${limiteAplicable} publicaciones permitidas para tu tipo de cuenta.`,
                limite: limiteAplicable,
                actual: cantidadPublicaciones,
                tipoUsuario: usuarioCompleto.tipoUsuario === 3 ? 'premium' : 'básico'
            });
            return;
        }

        // Si todo está bien, continuar
        next();
    } catch (error) {
        console.error('Error en validarLimitePublicaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al validar límite de publicaciones',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
