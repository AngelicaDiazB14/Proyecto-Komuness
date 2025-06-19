import { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../utils/jwt';

/**
 * Middleware para verificar el token de autenticación recuperado desde el cookie
 * @param req - Objeto de solicitud
 * @param res - Objeto de respuesta
 * @param next - Función para pasar al siguiente middleware
 * @returns void
 */
/*export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies.token;
        if (!token) {
            res.status(401).json({ message: 'No autorizado' });
            return;
        }

        const user = await verificarToken(token);

        console.log(`en la función ${authMiddleware.name} : ` + user);
        if (!user) {
            res.status(401).json({ message: 'No autorizado' });
            return;
        }

        (req as Request & { user?: any }).user = user;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error interno del servidor (middleware)',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};*/
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
        const status = await verificarToken(token);
        if (!status.usuario) {
            if (status.error === "Token expirado") {
                res.status(401).json({ message: 'Token expirado' });
                return;
            }
            if (status.error === "Token invalido") {
                res.status(401).json({ message: 'Token invalido' });
                return;
            }
            res.status(401).json({ message: 'No autorizado NULL USER' });
            return;
        }
        (req as Request & { user?: any }).user = status.usuario;
        next();

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: `Error interno del servidor en al funcion: ${authMiddleware.name}`,
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
}
