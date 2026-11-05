import express from 'express';

import Articulo from '../models/Articulo.js';
import Categoria from '../models/Categoria.js';
import Usuario from '../models/Usuario.js';
import '../models/relaciones.js';

import { proteger, soloRoles } from './auth.js';

const router = express.Router();

const esStaff = (req) => ['admin', 'pastelero'].includes(req.usuario.rol);

const incluirArticulo = {
  include: [
    { model: Categoria, as: 'categoria', attributes: ['id_categoria', 'nombre'] },
    { model: Usuario, as: 'usuario', attributes: ['id_usuario', 'nombre', 'apellidos'] },
  ],
};

/**
 * @openapi
 * /api/articulos:
 *   get:
 *     summary: Lista artículos publicados (público). Staff autenticado ve también los borradores
 *     tags: [Blog]
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema: { type: integer }
 *         description: Filtrar por id_categoria
 *     responses:
 *       200: { description: Lista de artículos }
 */
router.get('/', async (req, res) => {
  const autenticado = req.headers.authorization?.startsWith('Bearer ');
  let where = { publicado: 1 };
  // El staff con token válido ve también los no publicados
  if (autenticado) {
    try {
      const { default: jwt } = await import('jsonwebtoken');
      const { JWT_SECRET } = await import('../config/auth.js');
      const payload = jwt.verify(req.headers.authorization.split(' ')[1], JWT_SECRET);
      if (['admin', 'pastelero'].includes(payload.rol)) where = {};
    } catch { /* token inválido: se trata como público */ }
  }
  if (req.query.categoria) where.id_categoria = req.query.categoria;
  const articulos = await Articulo.findAll({ ...incluirArticulo, where, order: [['fecha', 'DESC']] });
  res.json(articulos);
});

/**
 * @openapi
 * /api/articulos/{id}:
 *   get:
 *     summary: Detalle de un artículo (público si está publicado; staff puede ver borradores)
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Artículo encontrado }
 *       403: { description: Es un borrador y no eres staff }
 *       404: { description: Artículo no existe }
 */
router.get('/:id', async (req, res) => {
  const articulo = await Articulo.findByPk(req.params.id, incluirArticulo);
  if (!articulo) return res.status(404).json({ error: 'Artículo no encontrado' });
  if (articulo.publicado !== 1) {
    let staff = false;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const { default: jwt } = await import('jsonwebtoken');
        const { JWT_SECRET } = await import('../config/auth.js');
        const payload = jwt.verify(req.headers.authorization.split(' ')[1], JWT_SECRET);
        staff = ['admin', 'pastelero'].includes(payload.rol);
      } catch { /* público */ }
    }
    if (!staff) return res.status(403).json({ error: 'Artículo no publicado' });
  }
  res.json(articulo);
});

/**
 * @openapi
 * /api/articulos:
 *   post:
 *     summary: Crea un artículo (solo admin/pastelero)
 *     tags: [Blog]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, contenido, etiquetas, id_categoria]
 *             properties:
 *               titulo: { type: string, example: "Cómo conservar una tarta de queso" }
 *               contenido: { type: string, example: "La tarta de queso aguanta 3 días..." }
 *               etiquetas: { type: string, example: "consejos,tartas" }
 *               id_categoria: { type: integer, example: 1 }
 *               publicado: { type: integer, example: 1 }
 *     responses:
 *       201: { description: Artículo creado }
 *       400: { description: Faltan campos obligatorios o la categoría no existe }
 *       403: { description: Sin permisos }
 */
router.post('/', proteger, soloRoles('admin', 'pastelero'), async (req, res) => {
  try {
    const { titulo, contenido, etiquetas, id_categoria, publicado } = req.body;
    if (!titulo || !contenido || !etiquetas || !id_categoria) {
      return res.status(400).json({ error: 'Faltan titulo, contenido, etiquetas o id_categoria' });
    }
    const categoria = await Categoria.findByPk(id_categoria);
    if (!categoria) return res.status(400).json({ error: 'La categoría indicada no existe' });
    const nuevo = await Articulo.create({
      id_usuario: req.usuario.id_usuario,
      id_categoria,
      titulo, contenido, etiquetas,
      publicado: publicado ?? 0,
      fecha: new Date(),
    });
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/articulos/{id}:
 *   put:
 *     summary: Modifica un artículo (solo admin/pastelero)
 *     tags: [Blog]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Artículo actualizado }
 *       400: { description: La categoría indicada no existe }
 *       403: { description: Sin permisos }
 *       404: { description: Artículo no existe }
 */
router.put('/:id', proteger, soloRoles('admin', 'pastelero'), async (req, res) => {
  try {
    const articulo = await Articulo.findByPk(req.params.id);
    if (!articulo) return res.status(404).json({ error: 'Artículo no encontrado' });
    const { titulo, contenido, etiquetas, id_categoria, publicado } = req.body;
    if (id_categoria !== undefined) {
      const categoria = await Categoria.findByPk(id_categoria);
      if (!categoria) return res.status(400).json({ error: 'La categoría indicada no existe' });
    }
    await articulo.update({
      ...(titulo !== undefined && { titulo }),
      ...(contenido !== undefined && { contenido }),
      ...(etiquetas !== undefined && { etiquetas }),
      ...(id_categoria !== undefined && { id_categoria }),
      ...(publicado !== undefined && { publicado: publicado ? 1 : 0 }),
    });
    res.json(articulo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/articulos/{id}:
 *   delete:
 *     summary: Elimina un artículo (solo admin)
 *     tags: [Blog]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Artículo eliminado }
 *       403: { description: Sin permisos }
 *       404: { description: Artículo no existe }
 */
router.delete('/:id', proteger, soloRoles('admin'), async (req, res) => {
  const articulo = await Articulo.findByPk(req.params.id);
  if (!articulo) return res.status(404).json({ error: 'Artículo no encontrado' });
  await articulo.destroy();
  res.json({ mensaje: 'Artículo eliminado' });
});

export default router;
