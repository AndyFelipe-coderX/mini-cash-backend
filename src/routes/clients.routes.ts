import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';

export const clientsRouter = Router();

// Todas las rutas de cliente requieren autenticación
clientsRouter.use(authMiddleware);

// Obtener perfil del cliente
clientsRouter.get('/me', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true, dni: true, nombres: true, apellidos: true,
                telefono: true, email: true, direccion: true,
                ocupacion: true, ingresoMensual: true,
                creditScore: true, createdAt: true,
            },
        });

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        // Obtener prestamo activo (si hay)
        const activeLoan = await prisma.loan.findFirst({
            where: { userId: user.id, status: 'ACTIVE' },
            include: { payments: true }
        });

        res.json({ user, activeLoan });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
});

// Obtener detalles del score y el historial crediticio
clientsRouter.get('/me/score', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { creditScore: true },
        });

        const history = await prisma.creditHistory.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        res.json({
            score: user?.creditScore,
            history,
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener historial crediticio' });
    }
});

// Actualizar perfil
clientsRouter.put('/me', async (req, res) => {
    try {
        const { email, direccion, ocupacion, ingresoMensual, telefono } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: req.userId },
            data: { email, direccion, ocupacion, ingresoMensual, telefono },
            select: {
                id: true, nombres: true, telefono: true, email: true, direccion: true
            }
        });

        res.json({ message: 'Perfil actualizado', user: updatedUser });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
});
