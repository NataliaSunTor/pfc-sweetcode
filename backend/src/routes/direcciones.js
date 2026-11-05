import express from 'express';
import { Op } from 'sequelize';

import DireccionEntrega from '../models/DireccionEntrega.js';
import Pedido from '../models/Pedido.js';
import '../models/relaciones.js';

import { proteger, soloRoles } from './auth.js';

const router = express.Router();

const esStaff = (req) => ['admin', 'pastelero'].includes(req.usuario.rol);

// Si la nueva dirección es principal, las demás del usuario dejan de serlo
async function desmarcarPrincipal(id_usuario, exceptoId, t) {
  await DireccionEntrega.update(
    { principal: 0 },
    { where: { id_usuario, principal: 1, id_direccion: { [Op.ne]: exceptoId } }, transaction: t },
  );
}

/**
 * @openapi
 * /api/direcciones:
 *   get:
 *     summary: Lista direcciones (cliente ve solo las suyas; staff todas)
 *     tags: [Direcciones]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de direcciones }
 *       401: { description: Falta token }
 */
router.get('/', proteger, async (req, res) => {
  const where = esStaff(req) ? {} : { id_usuario: req.usuario.id_usuario };
  const direcciones = await DireccionEntrega.findAll({ where, order: [['id_direccion', 'ASC']] });
  res.json(direcciones);
});

/**
 * @openapi
 * /api/direcciones/{id}:
 *   get:
 *     summary: Detalle de una dirección (el dueño o staff)
 *     tags: [Direcciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Dirección encontrada }
 *       403: { description: Es de otro usuario }
 *       404: { description: Dirección no existe }
 */
router.get('/:id', proteger, async (req, res) => {
  const direccion = await DireccionEntrega.findByPk(req.params.id);
  if (!direccion) return res.status(404).json({ error: 'Dirección no encontrada' });
  if (!esStaff(req) && direccion.id_usuario !== req.usuario.id_usuario) {
    return res.status(403).json({ error: 'No es tu dirección' });
  }
  res.json(direccion);
});

/**
 * @openapi
 * /api/direcciones:
 *   post:
 *     summary: Crea una dirección para el usuario autenticado
 *     tags: [Direcciones]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [calle, ciudad, codigo_postal, pais]
 *             properties:
 *               calle: { type: string, example: "Calle del Azúcar 12" }
 *               ciudad: { type: string, example: "Oviedo" }
 *               codigo_postal: { type: string, example: "33001" }
 *               pais: { type: string, example: "España" }
 *               principal: { type: integer, example: 0 }
 *     responses:
 *       201: { description: Dirección creada }
 *       400: { description: Faltan campos obligatorios }
 *       401: { description: Falta token }
 */
router.post('/', proteger, async (req, res) => {
  try {
    const { calle, ciudad, codigo_postal, pais, principal } = req.body;
    if (!calle || !ciudad || !codigo_postal || !pais) {
      return res.status(400).json({ error: 'Faltan calle, ciudad, codigo_postal o pais' });
    }
    const nueva = await DireccionEntrega.create({
      id_usuario: req.usuario.id_usuario,
      calle, ciudad, codigo_postal, pais,
      principal: principal ? 1 : 0,
    });
    if (nueva.principal === 1) {
      await desmarcarPrincipal(req.usuario.id_usuario, nueva.id_direccion);
    }
    res.status(201).json(nueva);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/direcciones/{id}:
 *   put:
 *     summary: Modifica una dirección (el dueño o staff)
 *     tags: [Direcciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Dirección actualizada }
 *       403: { description: Es de otro usuario }
 *       404: { description: Dirección no existe }
 */
router.put('/:id', proteger, async (req, res) => {
  const direccion = await DireccionEntrega.findByPk(req.params.id);
  if (!direccion) return res.status(404).json({ error: 'Dirección no encontrada' });
  if (!esStaff(req) && direccion.id_usuario !== req.usuario.id_usuario) {
    return res.status(403).json({ error: 'No es tu dirección' });
  }
  const { calle, ciudad, codigo_postal, pais, principal } = req.body;
  await direccion.update({
    ...(calle !== undefined && { calle }),
    ...(ciudad !== undefined && { ciudad }),
    ...(codigo_postal !== undefined && { codigo_postal }),
    ...(pais !== undefined && { pais }),
    ...(principal !== undefined && { principal: principal ? 1 : 0 }),
  });
  if (principal) {
    await desmarcarPrincipal(direccion.id_usuario, direccion.id_direccion);
  }
  res.json(direccion);
});

/**
 * @openapi
 * /api/direcciones/{id}:
 *   delete:
 *     summary: Elimina una dirección (el dueño o admin). Da 409 si tiene pedidos asociados
 *     tags: [Direcciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Dirección eliminada }
 *       403: { description: Es de otro usuario y no eres admin }
 *       404: { description: Dirección no existe }
 *       409: { description: Tiene pedidos asociados (FK NO ACTION) }
 */
router.delete('/:id', proteger, async (req, res) => {
  const direccion = await DireccionEntrega.findByPk(req.params.id);
  if (!direccion) return res.status(404).json({ error: 'Dirección no encontrada' });
  const esAdmin = req.usuario.rol === 'admin';
  if (!esStaff(req) && direccion.id_usuario !== req.usuario.id_usuario) {
    return res.status(403).json({ error: 'No es tu dirección' });
  }
  if (!esAdmin && direccion.id_usuario !== req.usuario.id_usuario) {
    return res.status(403).json({ error: 'Solo el dueño o un admin pueden borrarla' });
  }
  const pedidosAsociados = await Pedido.count({ where: { id_direccion: direccion.id_direccion } });
  if (pedidosAsociados > 0) {
    return res.status(409).json({ error: 'La dirección tiene pedidos asociados; no se puede borrar' });
  }
  await direccion.destroy();
  res.json({ mensaje: 'Dirección eliminada' });
});

export default router;
