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
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
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
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const status = yield (0, jwt_1.verificarToken)(token);
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
        req.user = status.usuario;
        next();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: `Error interno del servidor en al funcion: ${exports.authMiddleware.name}`,
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});
exports.authMiddleware = authMiddleware;
