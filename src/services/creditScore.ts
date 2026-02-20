// ================================================
// Servicio de Score Crediticio
// ================================================
// Calcula y actualiza el score del cliente
// basado en sus acciones financieras.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Puntos que suma/resta cada evento
const SCORE_RULES = {
    ACCOUNT_CREATED: 30,    // Score inicial al registrarse
    LOAN_APPROVED: 20,      // Primer préstamo aprobado
    PAYMENT_MADE: 10,       // Pago puntual
    LOAN_COMPLETED: 15,     // Préstamo completado (todas las cuotas)
    LATE_PAYMENT: -15,      // Pago atrasado
};

const MAX_SCORE = 100;
const MIN_SCORE = 0;

export async function updateCreditScore(
    userId: number,
    eventType: keyof typeof SCORE_RULES,
    description: string,
) {
    // 1. Obtener score actual del usuario
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuario no encontrado');

    // 2. Calcular nuevo score
    const scoreChange = SCORE_RULES[eventType];
    const newScore = Math.max(MIN_SCORE, Math.min(MAX_SCORE, user.creditScore + scoreChange));

    // 3. Registrar en historial crediticio
    await prisma.creditHistory.create({
        data: {
            userId,
            eventType,
            description,
            scoreChange,
            newScore,
        },
    });

    // 4. Actualizar score del usuario
    await prisma.user.update({
        where: { id: userId },
        data: { creditScore: newScore },
    });

    return { previousScore: user.creditScore, newScore, scoreChange };
}
