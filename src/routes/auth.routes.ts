import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../index';
import { updateCreditScore } from '../services/creditScore';

export const authRouter = Router();

// Validación con Zod
const registerSchema = z.object({
    dni: z.string().length(8),
    nombres: z.string().min(2),
    apellidos: z.string().min(2),
    telefono: z.string().min(9),
    email: z.string().email().optional(),
    password: z.string().min(6),
});

const loginSchema = z.object({
    identifier: z.string(), // DNI o Email asignado
    password: z.string(),
});

// Registrar nuevo cliente
authRouter.post('/register', async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);

        // 1. Verificar si ya existe
        const existingUser = await prisma.user.findUnique({
            where: { dni: data.dni },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'El DNI ya está registrado' });
        }

        // 2. Hashear password
        const passwordHash = await bcrypt.hash(data.password, 10);

        // 3. Crear usuario (DNI y Teléfono obligatorios)
        const newUser = await prisma.user.create({
            data: {
                dni: data.dni,
                nombres: data.nombres,
                apellidos: data.apellidos,
                telefono: data.telefono,
                email: data.email,
                passwordHash,
                role: 'CLIENT',
                creditScore: 30, // Score inicial base
            },
        });

        // 4. Inicializar score en el historial
        await updateCreditScore(newUser.id, 'ACCOUNT_CREATED', 'Creación de cuenta');

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: { id: newUser.id, nombres: newUser.nombres, dni: newUser.dni },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
        }
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Iniciar sesión
authRouter.post('/login', async (req, res) => {
    try {
        const { identifier, password } = loginSchema.parse(req.body);

        // Buscar por DNI o Email usando findFirst
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { dni: identifier },
                    { email: identifier },
                    { telefono: identifier }
                ]
            },
        });

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                nombres: user.nombres,
                role: user.role,
                score: user.creditScore,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
        }
        res.status(500).json({ error: 'Error del servidor' });
    }
});
