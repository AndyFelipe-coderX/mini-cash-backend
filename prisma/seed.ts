// Seed: Crea datos iniciales en la base de datos
// - 1 administrador por defecto
// - 2 clientes de prueba
// - 1 préstamo de ejemplo

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Sembrando datos iniciales...');

    // 1. Crear admin por defecto
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { dni: '00000000' },
        update: {},
        create: {
            dni: '00000000',
            nombres: 'Administrador',
            apellidos: 'Mini Cash',
            telefono: '922163731',
            email: 'admin@minicash.pe',
            passwordHash: adminPassword,
            role: 'ADMIN',
            creditScore: 100,
        },
    });
    console.log(`✅ Admin creado: ${admin.email}`);

    // 2. Crear cliente de prueba
    const clientPassword = await bcrypt.hash('cliente123', 10);
    const client1 = await prisma.user.upsert({
        where: { dni: '12345678' },
        update: {},
        create: {
            dni: '12345678',
            nombres: 'María',
            apellidos: 'García',
            telefono: '999888777',
            email: 'maria@example.com',
            direccion: 'Av. Larco 123, Lima',
            ocupacion: 'Comerciante',
            ingresoMensual: 1500,
            passwordHash: clientPassword,
            role: 'CLIENT',
            creditScore: 30,
        },
    });
    console.log(`✅ Cliente creado: ${client1.nombres} ${client1.apellidos}`);

    // 3. Crear un préstamo de ejemplo (ya aprobado)
    const loan = await prisma.loan.create({
        data: {
            userId: client1.id,
            amount: 200,
            term: 2,
            monthlyRate: 0.01,
            totalPayment: 203.01,
            monthlyPayment: 101.50,
            totalInterest: 3.01,
            status: 'ACTIVE',
            purpose: 'Negocio',
            approvedAt: new Date(),
        },
    });
    console.log(`✅ Préstamo creado: S/${loan.amount} para ${client1.nombres}`);

    // 4. Registrar un pago (cuota 1)
    await prisma.payment.create({
        data: {
            loanId: loan.id,
            amount: 101.50,
            monthNumber: 1,
        },
    });

    // 5. Crear historial crediticio
    await prisma.creditHistory.createMany({
        data: [
            {
                userId: client1.id,
                eventType: 'ACCOUNT_CREATED',
                description: 'Cuenta creada — score inicial',
                scoreChange: 30,
                newScore: 30,
            },
            {
                userId: client1.id,
                eventType: 'LOAN_APPROVED',
                description: 'Préstamo de S/200 aprobado',
                scoreChange: 20,
                newScore: 50,
            },
            {
                userId: client1.id,
                eventType: 'PAYMENT_MADE',
                description: 'Pago cuota 1/2 — S/101.50',
                scoreChange: 10,
                newScore: 60,
            },
        ],
    });

    // Actualizar score del cliente
    await prisma.user.update({
        where: { id: client1.id },
        data: { creditScore: 60 },
    });

    console.log(`✅ Historial crediticio creado para ${client1.nombres}`);
    console.log('\n🎉 Seed completado!');
    console.log('\n📋 Credenciales:');
    console.log('   Admin:   dni=00000000  pass=admin123');
    console.log('   Cliente: dni=12345678  pass=cliente123');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
