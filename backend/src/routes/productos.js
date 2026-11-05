import express from 'express';

import Producto from '../models/Producto.js';
import Categoria from '../models/Categoria.js';
import '../models/relaciones.js';

import { proteger, soloRoles } from './auth.js';

const router = express.Router();

const incluirCategoria = { include: [{ model: Categoria, as: 'categoria', attributes: ['id_categoria', 'nombre'] }] };

// Campos que el cliente puede enviar al crear/actualizar
const CAMPOS_EDITABLES = ['nombre', 'descripcion', 'precio', 'iva', 'stock', 'imagen', 'activo', 'id_categoria'];

/**
 * @openapi
 * /api/productos:
 *   get:
 *     summary: Lista todos los productos con su categoría
 *     tags: [Productos]
 *     responses:
 *       200: { description: Lista de productos }
 */
router.get('/', async (req, res) => {
  const productos = await Producto.findAll({
    where: { activo: 1 },
    ...incluirCategoria,
    order: [['id_producto', 'ASC']],
  });
  res.json(productos);
});

/**
 * @openapi
 * /api/productos/{id}:
 *   get:
 *     summary: Devuelve un producto por su id
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Producto encontrado }
 *       404: { description: Producto no existe }
 */
router.get('/:id', async (req, res) => {
  const producto = await Producto.findOne({
    where: { id_producto: req.params.id, activo: 1 },
    ...incluirCategoria,
  });
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(producto);
});

/**
 * @openapi
 * /api/productos:
 *   post:
 *     summary: Crea un producto (solo admin/pastelero)
 *     tags: [Productos]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, descripcion, precio, iva, id_categoria]
 *             properties:
 *               nombre: { type: string, example: "Tarta de queso" }
 *               descripcion: { type: string, example: "Tarta de queso asturiana" }
 *               precio: { type: number, example: 18.50 }
 *               iva: { type: number, example: 10.00 }
 *               stock: { type: integer, example: 12 }
 *               imagen: { type: string, example: "tarta-queso.jpg" }
 *               activo: { type: integer, example: 1 }
 *               id_categoria: { type: integer, example: 1 }
 *     responses:
 *       201: { description: Producto creado }
 *       400: { description: Faltan campos obligatorios o la categoría no existe }
 *       401: { description: Falta token }
 *       403: { description: Sin permisos (rol cliente) }
 */
router.post('/', proteger, soloRoles('admin', 'pastelero'), async (req, res) => {
  try {
    const { nombre, descripcion, precio, iva, stock, imagen, activo, id_categoria } = req.body;
    if (!nombre || !descripcion || precio === undefined || iva === undefined || !id_categoria) {
      return res.status(400).json({ error: 'Faltan nombre, descripcion, precio, iva o id_categoria' });
    }
    const categoria = await Categoria.findByPk(id_categoria);
    if (!categoria) return res.status(400).json({ error: 'La categoría indicada no existe' });

    const nuevo = await Producto.create({
      nombre,
      descripcion,
      precio,
      iva,
      stock: stock ?? 0,
      imagen: imagen ?? null,
      activo: activo ?? 1,
      fecha_alta: new Date(),
      id_categoria,
    });
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/productos/{id}:
 *   put:
 *     summary: Modifica un producto (solo admin/pastelero)
 *     tags: [Productos]
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
 *               nombre: { type: string }
 *               descripcion: { type: string }
 *               precio: { type: number }
 *               iva: { type: number }
 *               stock: { type: integer }
 *               imagen: { type: string }
 *               activo: { type: integer, description: "Si pasa a 0 se registra fecha_baja; si vuelve a 1 se limpia" }
 *               id_categoria: { type: integer }
 *     responses:
 *       200: { description: Producto actualizado }
 *       400: { description: La categoría indicada no existe }
 *       404: { description: Producto no existe }
 *       401: { description: Falta token }
 *       403: { description: Sin permisos }
 */
router.put('/:id', proteger, soloRoles('admin', 'pastelero'), async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    const datos = {};
    for (const campo of CAMPOS_EDITABLES) {
      if (req.body[campo] !== undefined) datos[campo] = req.body[campo];
    }
    if (datos.id_categoria !== undefined) {
      const categoria = await Categoria.findByPk(datos.id_categoria);
      if (!categoria) return res.status(400).json({ error: 'La categoría indicada no existe' });
    }
    // Baja/alta lógica: activo a 0 marca fecha_baja, volver a 1 la limpia
    if (datos.activo !== undefined) {
      datos.fecha_baja = datos.activo === 0 ? new Date() : null;
    }

    await producto.update(datos);
    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/productos/{id}:
 *   delete:
 *     summary: Elimina un producto (solo admin)
 *     tags: [Productos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Producto eliminado }
 *       404: { description: Producto no existe }
 *       401: { description: Falta token }
 *       403: { description: Sin permisos (rol pastelero o cliente) }
 */
router.delete('/:id', proteger, soloRoles('admin'), async (req, res) => {
  const producto = await Producto.findByPk(req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  await producto.update({ activo: 0, fecha_baja: new Date() });
  res.json({ mensaje: 'Producto dado de baja (lógica)' });
});

/**
 * @openapi
 * /api/productos/todos:
 *   get:
 *     summary: Lista TODOS los productos, incluidos dados de baja (admin/pastelero)
 *     tags: [Productos]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Catálogo completo }
 */
router.get('/todos', proteger, soloRoles('admin', 'pastelero'), async (req, res) => {
  const productos = await Producto.findAll({
    ...incluirCategoria,
    order: [['id_producto', 'ASC']],
  });
  res.json(productos);
});

export default router;
