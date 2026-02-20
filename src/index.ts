// ================================================
// Servidor Express principal — MINI CASH LOS ANDES
// ================================================
// Este es el punto de entrada de la API.
// Configura Express, CORS, y conecta todas las rutas.

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Importar rutas
import { authRouter } from './routes/auth.routes';
import { clientsRouter } from './routes/clients.routes';
import { loansRouter } from './routes/loans.routes';
import { adminRouter } from './routes/admin.routes';

// Cargar variables de entorno (.env)
dotenv.config();

// Crear instancia de Express y Prisma
const app = express();
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// ---- Middlewares globales ----

// CORS: permite que el frontend (puerto 8081) consulte la API (puerto 3001)
app.use(cors({
    origin: ['http://localhost:8081', 'http://localhost:19006', 'http://localhost:3000'],
    credentials: true,
}));

// Parsear JSON en el body de las peticiones
app.use(express.json());

// ---- Rutas ----

// Ruta de salud — para verificar que el servidor está activo
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        message: '🏦 MINI CASH LOS ANDES API está funcionando',
        timestamp: new Date().toISOString(),
    });
});

// Montar las rutas en sus prefijos
app.use('/api/auth', authRouter);       // /api/auth/register, /api/auth/login
app.use('/api/clients', clientsRouter); // /api/clients/me, /api/clients/me/score
app.use('/api/loans', loansRouter);     // /api/loans/apply, /api/loans/my
app.use('/api/admin', adminRouter);     // /api/admin/dashboard, /api/admin/loans

// ---- Iniciar servidor ----
app.listen(PORT, () => {
    console.log('');
    console.log('🏦 ═══════════════════════════════════════');
    console.log('   MINI CASH LOS ANDES — API Backend');
    console.log('   ─────────────────────────────────────');
    console.log(`   🌐 Servidor: http://localhost:${PORT}`);
    console.log(`   ❤️  Health:   http://localhost:${PORT}/api/health`);
    console.log('   ─────────────────────────────────────');
    console.log('   Rutas disponibles:');
    console.log(`   POST /api/auth/register`);
    console.log(`   POST /api/auth/login`);
    console.log(`   GET  /api/clients/me`);
    console.log(`   POST /api/loans/apply`);
    console.log(`   GET  /api/admin/dashboard`);
    console.log('═══════════════════════════════════════');
    console.log('');
});

export default app;
