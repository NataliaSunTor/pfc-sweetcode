import express from 'express';

import Categoria from '../models/Categoria.js';
import Producto from '../models/Producto.js';
import Articulo from '../models/Articulo.js';
import '../models/relaciones.js';

import { proteger, soloRoles } from './auth.js';

const router = express.Router();

const incluirRelaciones = {
  include: [
    { model: Producto, as: 'producto', attributes: ['id_producto', 'nombre', 'precio', 'activo'] },
    { model: Articulo, as: 'articulos', attributes: ['id_articulos', 'titulo', 'publicado'] },
  ],
};

/**
 * @openapi
 * /api/categorias:
 *   get:
 *     summary: Lista todas las categorías (público)
 *     tags: [Categorias]
 *     responses:
 *       200: { description: Lista de categorías }
 */
router.get('/', async (req, res) => {
  const categorias = await Categoria.findAll({ order: [['id_categoria', 'ASC']] });
  res.json(categorias);
});

/**
 * @openapi
 * /api/categorias/{id}:
 *   get:
 *     summary: Detalle de una categoría con sus productos y artículos (público)
 *     tags: [Categorias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Categoría encontrada }
 *       404: { description: Categoría no existe }
 */
router.get('/:id', async (req, res) => {
  const categoria = await Categoria.findByPk(req.params.id, incluirRelaciones);
  if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.json(categoria);
});

/**
 * @openapi
 * /api/categorias:
 *   post:
 *     summary: Crea una categoría (solo admin/pastelero)
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, descripcion]
 *             properties:
 *               nombre: { type: string, example: "bolleria" }
 *               descripcion: { type: string, example: "Bollería recién hecha" }
 *     responses:
 *       201: { description: Categoría creada }
 *       400: { description: Faltan campos obligatorios }
 *       409: { description: Ya existe una categoría con ese nombre }
 *       403: { description: Sin permisos }
 */
router.post('/', proteger, soloRoles('admin', 'pastelero'), async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre || !descripcion) {
      return res.status(400).json({ error: 'Faltan nombre o descripcion' });
    }
    const existe = await Categoria.findOne({ where: { nombre } });
    if (existe) return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    const nueva = await Categoria.create({ nombre, descripcion });
    res.status(201).json(nueva);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/categorias/{id}:
 *   put:
 *     summary: Modifica una categoría (solo admin/pastelero)
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Categoría actualizada }
 *       400: { description: El nombre ya lo usa otra categoría }
 *       404: { description: Categoría no existe }
 *       403: { description: Sin permisos }
 */
router.put('/:id', proteger, soloRoles('admin', 'pastelero'), async (req, res) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
    const { nombre, descripcion } = req.body;
    if (nombre && nombre !== categoria.nombre) {
      const existe = await Categoria.findOne({ where: { nombre } });
      if (existe) return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    await categoria.update({
      ...(nombre !== undefined && { nombre }),
      ...(descripcion !== undefined && { descripcion }),
    });
    res.json(categoria);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/categorias/{id}:
 *   delete:
 *     summary: Elimina una categoría (solo admin). Da 409 si tiene productos o artículos asociados
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Categoría eliminada }
 *       403: { description: Sin permisos (rol pastelero o cliente) }
 *       404: { description: Categoría no existe }
 *       409: { description: Tiene productos o artículos asociados (FK NO ACTION) }
 */
router.delete('/:id', proteger, soloRoles('admin'), async (req, res) => {
  const categoria = await Categoria.findByPk(req.params.id);
  if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
  const productos = await Producto.count({ where: { id_categoria: categoria.id_categoria } });
  const articulos = await Articulo.count({ where: { id_categoria: categoria.id_categoria } });
  if (productos > 0 || articulos > 0) {
    return res.status(409).json({ error: `La categoría tiene ${productos} productos y ${articulos} artículos asociados; no se puede borrar` });
  }
  await categoria.destroy();
  res.json({ mensaje: 'Categoría eliminada' });
});

export default router;
