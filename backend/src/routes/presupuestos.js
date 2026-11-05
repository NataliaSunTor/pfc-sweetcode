import express from 'express';

import SolicitudPresupuesto from '../models/SolicitudPresupuesto.js';
import Usuario from '../models/Usuario.js';
import Pedido from '../models/Pedido.js';
import '../models/relaciones.js';

import { proteger, soloRoles } from './auth.js';

const router = express.Router();

const ESTADOS = ['pendiente', 'presupuestado', 'aceptado', 'rechazado'];

const esStaff = (req) => ['admin', 'pastelero'].includes(req.usuario.rol);

const incluirSolicitud = {
  include: [
    { model: Usuario, as: 'usuario', attributes: ['id_usuario', 'nombre', 'apellidos', 'email'] },
    { model: Pedido, as: 'pedido' },
  ],
};

/**
 * @openapi
 * /api/presupuestos:
 *   get:
 *     summary: Lista solicitudes de presupuesto (cliente ve solo las suyas; staff todas)
 *     tags: [Presupuestos]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de solicitudes }
 *       401: { description: Falta token }
 */
router.get('/', proteger, async (req, res) => {
  const where = esStaff(req) ? {} : { id_usuario: req.usuario.id_usuario };
  const solicitudes = await SolicitudPresupuesto.findAll({ ...incluirSolicitud, where, order: [['id_presupuesto', 'DESC']] });
  res.json(solicitudes);
});

/**
 * @openapi
 * /api/presupuestos/{id}:
 *   get:
 *     summary: Detalle de una solicitud (el dueño o staff)
 *     tags: [Presupuestos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Solicitud encontrada }
 *       403: { description: Es de otro usuario }
 *       404: { description: Solicitud no existe }
 */
router.get('/:id', proteger, async (req, res) => {
  const solicitud = await SolicitudPresupuesto.findByPk(req.params.id, incluirSolicitud);
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
  if (!esStaff(req) && solicitud.id_usuario !== req.usuario.id_usuario) {
    return res.status(403).json({ error: 'No es tu solicitud' });
  }
  res.json(solicitud);
});

/**
 * @openapi
 * /api/presupuestos:
 *   post:
 *     summary: Crea una solicitud de presupuesto (cualquier usuario autenticado)
 *     tags: [Presupuestos]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipo_evento, descripcion, fecha_entrega]
 *             properties:
 *               tipo_evento: { type: string, example: "boda" }
 *               descripcion: { type: string, example: "Tarta de 3 pisos para 60 personas" }
 *               fecha_entrega: { type: string, format: date-time, example: "2026-12-20T12:00:00" }
 *     responses:
 *       201: { description: Solicitud creada en estado pendiente }
 *       400: { description: Faltan campos obligatorios }
 *       401: { description: Falta token }
 */
router.post('/', proteger, async (req, res) => {
  try {
    const { tipo_evento, descripcion, fecha_entrega } = req.body;
    if (!tipo_evento || !descripcion || !fecha_entrega) {
      return res.status(400).json({ error: 'Faltan tipo_evento, descripcion o fecha_entrega' });
    }
    const nueva = await SolicitudPresupuesto.create({
      id_usuario: req.usuario.id_usuario,
      id_pedido: null,
      fecha: new Date(),
      tipo_evento,
      descripcion,
      precio_estimado: null,
      fecha_entrega: new Date(fecha_entrega),
      estado: 'pendiente',
    });
    res.status(201).json(nueva);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/presupuestos/{id}/respuesta:
 *   put:
 *     summary: Responde una solicitud con precio estimado (solo admin/pastelero)
 *     tags: [Presupuestos]
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
 *             required: [precio_estimado]
 *             properties:
 *               precio_estimado: { type: number, example: 120.00 }
 *     responses:
 *       200: { description: Solicitud presupuestada }
 *       400: { description: Falta precio_estimado }
 *       403: { description: Sin permisos }
 *       404: { description: Solicitud no existe }
 */
router.put('/:id/respuesta', proteger, soloRoles('admin', 'pastelero'), async (req, res) => {
  const { precio_estimado } = req.body;
  if (precio_estimado === undefined || Number(precio_estimado) <= 0) {
    return res.status(400).json({ error: 'Falta precio_estimado (> 0)' });
  }
  const solicitud = await SolicitudPresupuesto.findByPk(req.params.id);
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
  await solicitud.update({ precio_estimado, estado: 'presupuestado' });
  res.json(solicitud);
});

/**
 * @openapi
 * /api/presupuestos/{id}/estado:
 *   put:
 *     summary: Cambia el estado de la solicitud (staff cambia estado; el dueño puede aceptar/rechazar)
 *     tags: [Presupuestos]
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
 *             required: [estado]
 *             properties:
 *               estado: { type: string, enum: [pendiente, presupuestado, aceptado, rechazado] }
 *     responses:
 *       200: { description: Estado actualizado }
 *       400: { description: Estado no válido }
 *       403: { description: Sin permisos }
 *       404: { description: Solicitud no existe }
 */
router.put('/:id/estado', proteger, async (req, res) => {
  const { estado } = req.body;
  if (!ESTADOS.includes(estado)) {
    return res.status(400).json({ error: `Estado no válido. Valores: ${ESTADOS.join(', ')}` });
  }
  const solicitud = await SolicitudPresupuesto.findByPk(req.params.id);
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
  // El dueño solo puede aceptar o rechazar su propio presupuesto; el staff cualquier estado
  if (!esStaff(req)) {
    if (solicitud.id_usuario !== req.usuario.id_usuario) {
      return res.status(403).json({ error: 'No es tu solicitud' });
    }
    if (!['aceptado', 'rechazado'].includes(estado)) {
      return res.status(403).json({ error: 'El cliente solo puede aceptar o rechazar' });
    }
    if (solicitud.estado !== 'presupuestado') {
      return res.status(400).json({ error: 'Aún no hay presupuesto que aceptar/rechazar' });
    }
  }
  await solicitud.update({ estado });
  res.json(solicitud);
});

/**
 * @openapi
 * /api/presupuestos/{id}:
 *   delete:
 *     summary: Elimina una solicitud (admin, o el dueño si aún está pendiente)
 *     tags: [Presupuestos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Solicitud eliminada }
 *       403: { description: Sin permisos }
 *       404: { description: Solicitud no existe }
 */
router.delete('/:id', proteger, async (req, res) => {
  const solicitud = await SolicitudPresupuesto.findByPk(req.params.id);
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
  const esAdmin = req.usuario.rol === 'admin';
  const esDueno = solicitud.id_usuario === req.usuario.id_usuario;
  if (!esAdmin && !(esDueno && solicitud.estado === 'pendiente')) {
    return res.status(403).json({ error: 'Solo admin, o el dueño si está pendiente' });
  }
  await solicitud.destroy();
  res.json({ mensaje: 'Solicitud eliminada' });
});

export default router;
