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

// Ruta raíz — Página de bienvenida para el navegador web
app.get('/', (_req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>API - Mini Cash Los Andes</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #09090f; color: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                .container { background: rgba(255, 255, 255, 0.05); padding: 40px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); max-width: 600px; }
                h1 { color: #dbdee3; font-size: 2.5em; margin-bottom: 10px; }
                p { color: #9a9cae; font-size: 1.1em; line-height: 1.6; margin-bottom: 20px; }
                .status { display: inline-block; padding: 8px 16px; background-color: rgba(46, 204, 113, 0.2); color: #2ecc71; border-radius: 50px; font-weight: bold; font-size: 0.9em; margin-bottom: 30px; }
                .endpoints code { background: rgba(255, 255, 255, 0.1); padding: 4px 8px; border-radius: 6px; font-family: monospace; color: #a181ff; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🏦 Mini Cash Los Andes API</h1>
                <div class="status">🟢 Servicio en línea y conectado</div>
                <p>Bienvenido al backend oficial. Esta URL no está diseñada para ser navegada visualmente; es el motor de datos <b>exclusivo para la Aplicación Móvil</b>.</p>
                <p class="endpoints" style="text-align: left; background: rgba(0,0,0,0.2); padding: 20px; border-radius: 10px;">
                    <b>Endpoints principales:</b><br><br>
                    • Salud: <a href="/api/health" style="color: #a181ff">/api/health</a><br>
                    • Autenticación: <code>/api/auth/login</code><br>
                    • Préstamos: <code>/api/loans/...</code><br>
                    • Clientes: <code>/api/clients/...</code>
                </p>
                <p style="font-size: 0.8em; margin-top: 30px; color: #666;">© 2026 Mini Cash Los Andes S.A.C. Todos los derechos reservados.</p>
            </div>
        </body>
        </html>
    `);
});

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
