import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';

export const loansRouter = Router();

loansRouter.use(authMiddleware);

const loanApplySchema = z.object({
    amount: z.number().min(50).max(300),
    term: z.number().min(1).max(3),
    purpose: z.string().optional(),
});

// Solicitar nuevo préstamo
loansRouter.post('/apply', async (req, res) => {
    try {
        // 1. Verificar si ya tiene un préstamo activo o pendiente
        const existingLoan = await prisma.loan.findFirst({
            where: {
                userId: req.userId,
                status: { in: ['PENDING', 'ACTIVE'] },
            },
        });

        if (existingLoan) {
            return res.status(400).json({
                error: 'Ya tienes un préstamo en curso',
                message: 'Debes terminar de pagar tu préstamo actual antes de solicitar otro.',
            });
        }

        // 2. Procesar solicitud
        const { amount, term, purpose } = loanApplySchema.parse(req.body);

        const monthlyRate = 0.01; // 1% mensual
        // Fórmula de amortización simple para este caso corto
        // Interés total simple aproximado: Monto * tasa * meses
        const totalInterest = amount * monthlyRate * term;
        const totalPayment = amount + totalInterest;
        const monthlyPayment = totalPayment / term;

        const newLoan = await prisma.loan.create({
            data: {
                userId: req.userId!,
                amount,
                term,
                monthlyRate,
                totalPayment,
                monthlyPayment,
                totalInterest,
                purpose,
                status: 'PENDING',
            },
        });

        res.status(201).json({
            message: 'Préstamo solicitado exitosamente',
            loan: newLoan,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
        }
        res.status(500).json({ error: 'Error al solicitar préstamo' });
    }
});

// Ver todos mis préstamos
loansRouter.get('/my', async (req, res) => {
    try {
        const loans = await prisma.loan.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            include: {
                payments: true,
            },
        });

        res.json({ loans });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener préstamos' });
    }
});
