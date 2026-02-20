// ================================================
// Middleware Admin Only
// ================================================
// Verifica que el usuario autenticado es ADMIN.
// Debe usarse DESPUÉS del authMiddleware.

import { Request, Response, NextFunction } from 'express';

export function adminOnly(req: Request, res: Response, next: NextFunction) {
    if (req.userRole !== 'ADMIN') {
        return res.status(403).json({
            error: 'Acceso denegado',
            message: 'Esta acción requiere permisos de administrador.',
        });
    }
    next();
}
