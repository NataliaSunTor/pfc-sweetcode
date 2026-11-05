import express from 'express';
import { Op } from 'sequelize';

import Usuario from '../models/Usuario.js';
import '../models/relaciones.js';

import { proteger, soloRoles } from './auth.js';

const router = express.Router();

const ROLES = ['admin', 'pastelero', 'cliente'];

// Todo este router es solo para admin
router.use(proteger, soloRoles('admin'));

// Cuenta cuántos admins activos quedan (para no quedarnos sin ninguno)
const adminsActivos = (exceptoId = null) =>
  Usuario.count({
    where: {
      rol: 'admin',
      activo: 1,
      ...(exceptoId !== null && { id_usuario: { [Op.ne]: exceptoId } }),
    },
  });

/**
 * @openapi
 * /api/usuarios:
 *   get:
 *     summary: Lista todos los usuarios (solo admin). Sin password_hash
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de usuarios }
 *       401: { description: Falta token }
 *       403: { description: Sin permisos (no admin) }
 */
router.get('/', async (req, res) => {
  const usuarios = await Usuario.findAll({ order: [['id_usuario', 'ASC']] });
  res.json(usuarios);
});

/**
 * @openapi
 * /api/usuarios/{id}:
 *   get:
 *     summary: Detalle de un usuario (solo admin)
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Usuario encontrado }
 *       404: { description: Usuario no existe }
 */
router.get('/:id', async (req, res) => {
  const usuario = await Usuario.findByPk(req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(usuario);
});

/**
 * @openapi
 * /api/usuarios/{id}:
 *   put:
 *     summary: Modifica rol/activo/telefono de un usuario (solo admin)
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rol: { type: string, enum: [admin, pastelero, cliente] }
 *               activo: { type: integer, example: 1 }
 *               telefono: { type: string }
 *     responses:
 *       200: { description: Usuario actualizado }
 *       400: { description: Rol no válido, o se dejaría la app sin admin activo }
 *       404: { description: Usuario no existe }
 */
router.put('/:id', async (req, res) => {
  const usuario = await Usuario.findByPk(req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { rol, activo, telefono } = req.body;
  if (rol !== undefined && !ROLES.includes(rol)) {
    return res.status(400).json({ error: `Rol no válido. Valores: ${ROLES.join(', ')}` });
  }

  // No dejar la app sin ningún admin activo
  const quitaAdmin = (rol !== undefined && rol !== 'admin' && usuario.rol === 'admin') ||
                    (activo !== undefined && activo === 0 && usuario.rol === 'admin' && usuario.activo === 1);
  if (quitaAdmin && (await adminsActivos(usuario.id_usuario)) === 0) {
    return res.status(400).json({ error: 'No se puede dejar la aplicación sin ningún admin activo' });
  }

  await usuario.update({
    ...(rol !== undefined && { rol }),
    ...(activo !== undefined && { activo: activo ? 1 : 0 }),
    ...(telefono !== undefined && { telefono }),
  });
  res.json(usuario);
});

/**
 * @openapi
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Baja lógica de un usuario (activo=0, solo admin). No se puede uno mismo
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Usuario desactivado }
 *       400: { description: Uno mismo no se puede desactivar, o dejaría la app sin admin }
 *       404: { description: Usuario no existe }
 */
router.delete('/:id', async (req, res) => {
  const usuario = await Usuario.findByPk(req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (usuario.id_usuario === req.usuario.id_usuario) {
    return res.status(400).json({ error: 'No te puedes desactivar a ti mismo' });
  }
  if (usuario.rol === 'admin' && usuario.activo === 1 && (await adminsActivos(usuario.id_usuario)) === 0) {
    return res.status(400).json({ error: 'No se puede desactivar al último admin activo' });
  }
  await usuario.update({ activo: 0 });
  res.json({ mensaje: 'Usuario desactivado', id_usuario: usuario.id_usuario });
});

export default router;
