import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import { JWT_SECRET, generarToken } from '../config/auth.js';

const router = express.Router();

// ── Middleware para proteger rutas (VA ANTES DE USARSE) ──
export const proteger = async (req, res, next) => {
  const cabecera = req.headers.authorization;
  if (!cabecera?.startsWith('Bearer ')) return res.status(401).json({ error: 'Falta el token' });
  try {
    req.usuario = jwt.verify(cabecera.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// ── Middleware de roles: soloRoles('admin', 'pastelero') ──
export const soloRoles = (...roles) => (req, res, next) => {
  if (!req.usuario) return res.status(401).json({ error: 'Falta autenticación' });
  if (!roles.includes(req.usuario.rol)) {
    return res.status(403).json({ error: 'No tienes permisos para esto' });
  }
  next();
};

/**
 * @openapi
 * /api/auth/registro:
 *   post:
 *     summary: Registra un nuevo usuario (rol cliente)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, apellidos, email, password]
 *             properties:
 *               nombre: { type: string, example: "María" }
 *               apellidos: { type: string, example: "García" }
 *               email: { type: string, example: "maria@ejemplo.com" }
 *               password: { type: string, example: "mipassword" }
 *     responses:
 *       201: { description: Usuario creado, devuelve token }
 *       409: { description: Ese email ya está registrado }
 *       400: { description: Faltan campos obligatorios }
 */
router.post('/registro', async (req, res) => {
  try {
    const { nombre, apellidos, email, password } = req.body;
    if (!nombre || !apellidos || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    const existente = await Usuario.findOne({ where: { email } });
    if (existente) return res.status(409).json({ error: 'Ese email ya está registrado' });

    const nuevo = await Usuario.create({
      nombre, apellidos, email, rol: 'cliente', activo: true,
      password_hash: await bcrypt.hash(password, 10),
    });
    res.status(201).json({ mensaje: 'Usuario creado', token: generarToken(nuevo) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión y devuelve un JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "cliente@testing.com" }
 *               password: { type: string, example: "cliente123" }
 *     responses:
 *       200: { description: Login correcto, devuelve token }
 *       401: { description: Credenciales incorrectas }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.scope('conHash').findOne({ where: { email } });
    if (!usuario) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const ok = await bcrypt.compare(password, usuario.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });

    await usuario.update({ ultimo_acceso: new Date() });
    res.json({ mensaje: 'Login correcto', token: generarToken(usuario) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/auth/perfil:
 *   get:
 *     summary: Devuelve el usuario autenticado
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Datos del usuario }
 *       401: { description: Token ausente, inválido o expirado }
 */
router.get('/perfil', proteger, async (req, res) => {
  const usuario = await Usuario.findByPk(req.usuario.id_usuario);
  res.json(usuario);
});

export default router;