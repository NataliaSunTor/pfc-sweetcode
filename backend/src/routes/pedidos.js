import express from 'express';

import sequelize from '../config/db.js';
import Pedido from '../models/Pedido.js';
import LineaPedido from '../models/LineaPedido.js';
import Producto from '../models/Producto.js';
import Usuario from '../models/Usuario.js';
import DireccionEntrega from '../models/DireccionEntrega.js';
import SolicitudPresupuesto from '../models/SolicitudPresupuesto.js';
import '../models/relaciones.js';

import { proteger, soloRoles } from './auth.js';

const router = express.Router();

const ESTADOS = ['pendiente', 'en_preparacion', 'enviado', 'entregado', 'cancelado'];

const incluirPedido = {
  include: [
    { model: LineaPedido, as: 'lineas_pedido', include: [{ model: Producto, as: 'producto', attributes: ['id_producto', 'nombre', 'precio', 'imagen'] }] },
    { model: Usuario, as: 'usuario', attributes: ['id_usuario', 'nombre', 'apellidos', 'email'] },
    { model: DireccionEntrega, as: 'direccion' },
  ],
};

// Un cliente solo ve sus pedidos; admin y pastelero los ven todos
const esStaff = (req) => ['admin', 'pastelero'].includes(req.usuario.rol);

/**
 * @openapi
 * /api/pedidos:
 *   get:
 *     summary: Lista pedidos (cliente ve solo los suyos; staff los ve todos)
 *     tags: [Pedidos]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de pedidos con líneas, usuario y dirección }
 *       401: { description: Falta token }
 */
router.get('/', proteger, async (req, res) => {
  const where = esStaff(req) ? {} : { id_usuario: req.usuario.id_usuario };
  const pedidos = await Pedido.findAll({ ...incluirPedido, where, order: [['id_pedido', 'DESC']] });
  res.json(pedidos);
});

/**
 * @openapi
 * /api/pedidos/{id}:
 *   get:
 *     summary: Detalle de un pedido (el dueño o staff)
 *     tags: [Pedidos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Pedido encontrado }
 *       403: { description: Es de otro usuario }
 *       404: { description: Pedido no existe }
 */
router.get('/:id', proteger, async (req, res) => {
  const pedido = await Pedido.findByPk(req.params.id, incluirPedido);
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  if (!esStaff(req) && pedido.id_usuario !== req.usuario.id_usuario) {
    return res.status(403).json({ error: 'No es tu pedido' });
  }
  res.json(pedido);
});

/**
 * @openapi
 * /api/pedidos:
 *   post:
 *     summary: Crea un pedido con sus líneas (cualquier usuario autenticado)
 *     tags: [Pedidos]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_direccion, lineas]
 *             properties:
 *               id_direccion: { type: integer, example: 1 }
 *               observaciones: { type: string, example: "Sin gluten si es posible" }
 *               lineas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [id_producto, cantidad]
 *                   properties:
 *                     id_producto: { type: integer, example: 1 }
 *                     cantidad: { type: integer, example: 2 }
 *     responses:
 *       201: { description: Pedido creado con líneas e importe calculado }
 *       400: { description: Dirección inválida, producto inexistente/inactivo o stock insuficiente }
 *       401: { description: Falta token }
 */
router.post('/', proteger, async (req, res) => {
  const { id_direccion, observaciones, lineas } = req.body;
  if (!id_direccion || !Array.isArray(lineas) || lineas.length === 0) {
    return res.status(400).json({ error: 'Faltan id_direccion o lineas (mínimo 1)' });
  }

  const direccion = await DireccionEntrega.findByPk(id_direccion);
  if (!direccion) return res.status(400).json({ error: 'La dirección indicada no existe' });
  if (!esStaff(req) && direccion.id_usuario !== req.usuario.id_usuario) {
    return res.status(403).json({ error: 'Esa dirección no es tuya' });
  }

  // Validar productos y stock antes de tocar nada
  const items = [];
  for (const l of lineas) {
    const cantidad = Number(l.cantidad);
    if (!l.id_producto || !Number.isInteger(cantidad) || cantidad <= 0) {
      return res.status(400).json({ error: 'Cada línea necesita id_producto y cantidad > 0' });
    }
    const producto = await Producto.findByPk(l.id_producto);
    if (!producto || producto.activo !== 1) {
      return res.status(400).json({ error: `El producto ${l.id_producto} no existe o no está activo` });
    }
    if (producto.stock < cantidad) {
      return res.status(400).json({ error: `Stock insuficiente de "${producto.nombre}" (quedan ${producto.stock})` });
    }
    items.push({ producto, cantidad, precio_unitario: producto.precio, subtotal: cantidad * Number(producto.precio) });
  }
  const importeTotal = items.reduce((acc, i) => acc + i.subtotal, 0);

  try {
    const nuevo = await sequelize.transaction(async (t) => {
      const pedido = await Pedido.create({
        id_usuario: req.usuario.id_usuario,
        id_direccion,
        fecha: new Date(),
        estado: 'pendiente',
        importe_total: importeTotal.toFixed(2),
        observaciones: observaciones ?? null,
      }, { transaction: t });
      for (const i of items) {
        await LineaPedido.create({
          id_pedido: pedido.id_pedido,
          id_producto: i.producto.id_producto,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
          subtotal: i.subtotal.toFixed(2),
        }, { transaction: t });
        await i.producto.decrement('stock', { by: i.cantidad, transaction: t });
      }
      return pedido;
    });
    const pedidoCompleto = await Pedido.findByPk(nuevo.id_pedido, incluirPedido);
    res.status(201).json(pedidoCompleto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/pedidos/{id}/estado:
 *   put:
 *     summary: Cambia el estado de un pedido (solo admin/pastelero)
 *     tags: [Pedidos]
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
 *               estado: { type: string, enum: [pendiente, en_preparacion, enviado, entregado, cancelado] }
 *     responses:
 *       200: { description: Estado actualizado }
 *       400: { description: Estado no válido }
 *       403: { description: Sin permisos }
 *       404: { description: Pedido no existe }
 */
router.put('/:id/estado', proteger, soloRoles('admin', 'pastelero'), async (req, res) => {
  const { estado } = req.body;
  if (!ESTADOS.includes(estado)) {
    return res.status(400).json({ error: `Estado no válido. Valores: ${ESTADOS.join(', ')}` });
  }
  const pedido = await Pedido.findByPk(req.params.id);
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  await pedido.update({ estado });
  res.json(pedido);
});

/**
 * @openapi
 * /api/pedidos/{id}:
 *   delete:
 *     summary: Elimina un pedido y sus líneas (solo admin)
 *     tags: [Pedidos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Pedido eliminado }
 *       403: { description: Sin permisos (rol pastelero o cliente) }
 *       404: { description: Pedido no existe }
 */
router.delete('/:id', proteger, soloRoles('admin'), async (req, res) => {
  const pedido = await Pedido.findByPk(req.params.id);
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  try {
    await sequelize.transaction(async (t) => {
      // Las FK son NO ACTION: desvinculamos solicitudes y borramos líneas a mano
      await SolicitudPresupuesto.update({ id_pedido: null }, { where: { id_pedido: pedido.id_pedido }, transaction: t });
      await LineaPedido.destroy({ where: { id_pedido: pedido.id_pedido }, transaction: t });
      await pedido.destroy({ transaction: t });
    });
    res.json({ mensaje: 'Pedido eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
