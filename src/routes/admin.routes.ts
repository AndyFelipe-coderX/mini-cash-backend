import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';
import { updateCreditScore } from '../services/creditScore';

export const adminRouter = Router();

// Proteger todas las rutas de este router (Admin Only)
adminRouter.use(authMiddleware);
adminRouter.use(adminOnly);

// Dashboard resumen
adminRouter.get('/dashboard', async (_req, res) => {
    try {
        const [totalClients, totalActiveLoans, pendingRequests, users] = await Promise.all([
            prisma.user.count({ where: { role: 'CLIENT' } }),
            prisma.loan.count({ where: { status: 'ACTIVE' } }),
            prisma.loan.count({ where: { status: 'PENDING' } }),
            prisma.user.findMany({ select: { creditScore: true }, where: { role: 'CLIENT' } }),
        ]);

        const activeLoansInfo = await prisma.loan.aggregate({
            where: { status: 'ACTIVE' },
            _sum: { amount: true },
        });

        const averageScore = users.length > 0
            ? Math.round(users.reduce((sum, u) => sum + u.creditScore, 0) / users.length)
            : 0;

        res.json({
            stats: {
                totalClients,
                totalActiveLoans,
                totalLent: activeLoansInfo._sum.amount || 0,
                pendingRequests,
                averageScore,
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar dashboard' });
    }
});

// Ver todos los clientes
adminRouter.get('/clients', async (_req, res) => {
    try {
        const clients = await prisma.user.findMany({
            where: { role: 'CLIENT' },
            orderBy: { createdAt: 'desc' },
            include: {
                loans: {
                    where: { status: 'ACTIVE' },
                    select: { amount: true, status: true },
                }
            }
        });

        const formattedClients = clients.map(c => ({
            id: c.id,
            name: `${c.nombres} ${c.apellidos}`,
            dni: c.dni,
            phone: c.telefono,
            score: c.creditScore,
            activeAmount: c.loans.length > 0 ? c.loans[0].amount : 0,
            status: c.loans.length > 0 ? 'activo' : 'sin_prestamo',
        }));

        res.json({ clients: formattedClients });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// Ver solicitudes pendientes
adminRouter.get('/loans/pending', async (_req, res) => {
    try {
        const requests = await prisma.loan.findMany({
            where: { status: 'PENDING' },
            include: {
                user: { select: { nombres: true, apellidos: true, dni: true, creditScore: true } }
            },
            orderBy: { createdAt: 'asc' },
        });

        res.json({ requests });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener solicitudes' });
    }
});

// Aprobar préstamo
adminRouter.put('/loans/:id/approve', async (req, res) => {
    try {
        const loanId = parseInt(req.params.id);

        const loan = await prisma.loan.update({
            where: { id: loanId },
            data: { status: 'ACTIVE', approvedAt: new Date() },
            include: { user: true }
        });

        // Score += 20 por el primer préstamo
        await updateCreditScore(loan.userId, 'LOAN_APPROVED', `Préstamo aprobado (S/${loan.amount})`);

        res.json({ message: 'Préstamo aprobado exitosamente', loan });
    } catch (error) {
        res.status(500).json({ error: 'Error al aprobar préstamo' });
    }
});

// Rechazar préstamo
adminRouter.put('/loans/:id/reject', async (req, res) => {
    try {
        const loanId = parseInt(req.params.id);
        const { reason } = req.body;

        await prisma.loan.update({
            where: { id: loanId },
            data: { status: 'REJECTED', rejectionReason: reason || 'No cumple requisitos' },
        });

        res.json({ message: 'Préstamo rechazado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al rechazar préstamo' });
    }
});

// Registrar pago de cuota
adminRouter.post('/payments/:loanId', async (req, res) => {
    try {
        const loanId = parseInt(req.params.loanId);

        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            include: { payments: true }
        });

        if (!loan || loan.status !== 'ACTIVE') {
            return res.status(400).json({ error: 'Préstamo no válido o no está activo' });
        }

        const currentPaymentCount = loan.payments.length;
        if (currentPaymentCount >= loan.term) {
            return res.status(400).json({ error: 'Este préstamo ya tiene todas las cuotas pagadas' });
        }

        // Crear el pago
        const payment = await prisma.payment.create({
            data: {
                loanId,
                amount: loan.monthlyPayment,
                monthNumber: currentPaymentCount + 1,
            }
        });

        // Aumentar score por pago
        await updateCreditScore(loan.userId, 'PAYMENT_MADE', `Pago de cuota ${payment.monthNumber}/${loan.term}`);

        // Si fue la última cuota, marcar préstamo como completado
        if (currentPaymentCount + 1 === loan.term) {
            await prisma.loan.update({
                where: { id: loanId },
                data: { status: 'COMPLETED', completedAt: new Date() },
            });

            // Bonus por completar préstamo
            await updateCreditScore(loan.userId, 'LOAN_COMPLETED', `Préstamo completado exitosamente (#${loan.id})`);
        }

        res.status(201).json({ message: 'Pago registrado exitosamente', payment });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar pago' });
    }
});
