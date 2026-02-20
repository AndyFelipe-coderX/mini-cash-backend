// ================================================
// Middleware de Autenticación (JWT)
// ================================================
// Verifica que el usuario envía un token válido
// en el header "Authorization: Bearer <token>"
// Si es válido, agrega userId y role al request

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extender el tipo Request de Express para incluir userId y role
declare global {
    namespace Express {
        interface Request {
            userId?: number;
            userRole?: string;
        }
    }
}

interface JwtPayload {
    userId: number;
    role: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    // 1. Extraer el token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'No autorizado',
            message: 'Token no proporcionado. Envía: Authorization: Bearer <token>',
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 2. Verificar y decodificar el token
        const secret = process.env.JWT_SECRET || 'default-secret';
        const decoded = jwt.verify(token, secret) as JwtPayload;

        // 3. Agregar datos del usuario al request
        req.userId = decoded.userId;
        req.userRole = decoded.role;

        next();
    } catch (error) {
        return res.status(401).json({
            error: 'Token inválido',
            message: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
        });
    }
}
