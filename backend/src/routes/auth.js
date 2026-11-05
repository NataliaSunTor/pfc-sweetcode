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
    const payload = jwt.verify(cabecera.split(' ')[1], JWT_SECRET);
    // El token puede ser válido pero el usuario estar desactivado (baja lógica)
    const usuario = await Usuario.findByPk(payload.id_usuario);
    if (!usuario || usuario.activo !== 1) {
      return res.status(401).json({ error: 'Usuario desactivado o no existe' });
    }
    req.usuario = payload;
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

    const ahora = new Date();
    const nuevo = await Usuario.create({
      nombre, apellidos, email, rol: 'cliente', activo: 1,
      password_hash: await bcrypt.hash(password, 10),
      fecha_alta: ahora,
      ultimo_acceso: ahora,
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
     if (!email || !password) return res.status(400).json({ error: 'Faltan email o password' });
    const usuario = await Usuario.scope('conHash').findOne({ where: { email } });
    if (!usuario) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const ok = await bcrypt.compare(password, usuario.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });
    if (usuario.activo !== 1) return res.status(401).json({ error: 'Usuario desactivado' });

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

/**
 * @openapi
 * /api/auth/perfil:
 *   put:
 *     summary: Actualiza el propio perfil (nombre, apellidos, telefono, email, password)
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre: { type: string, example: "Natalia" }
 *               apellidos: { type: string, example: "Cliente Prueba" }
 *               telefono: { type: string, example: "600123123" }
 *               email: { type: string, example: "natalia@nuevo.com" }
 *               password: { type: string, example: "nuevaPassword123" }
 *     responses:
 *       200: { description: Perfil actualizado }
 *       400: { description: Email vacío o ya en uso por otro usuario }
 *       401: { description: Falta token }
 */
router.put('/perfil', proteger, async (req, res) => {
  try {
    const usuario = await Usuario.scope('conHash').findByPk(req.usuario.id_usuario);
    const { nombre, apellidos, telefono, email, password } = req.body;

    if (email !== undefined) {
      if (!email) return res.status(400).json({ error: 'El email no puede estar vacío' });
      const existe = await Usuario.findOne({ where: { email } });
      if (existe && existe.id_usuario !== usuario.id_usuario) {
        return res.status(409).json({ error: 'Ese email ya está registrado' });
      }
    }

    await usuario.update({
      ...(nombre !== undefined && { nombre }),
      ...(apellidos !== undefined && { apellidos }),
      ...(telefono !== undefined && { telefono }),
      ...(email !== undefined && { email }),
      ...(password !== undefined && { password_hash: await bcrypt.hash(password, 10) }),
    });
    res.json({ mensaje: 'Perfil actualizado', usuario: await Usuario.findByPk(usuario.id_usuario) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;