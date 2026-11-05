import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { proteger, soloRoles } from './auth.js';

const router = express.Router();

// Carpeta de subida (dentro de /app, que es el volumen ./backend del host)
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    // nombre corto: cabe en productos.imagen VARCHAR(45)
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Solo se permiten ficheros de imagen'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

/**
 * @openapi
 * /api/upload:
 *   post:
 *     summary: Sube una imagen (solo admin/pastelero) y devuelve su URL
 *     tags: [Upload]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [imagen]
 *             properties:
 *               imagen: { type: string, format: binary, description: "Fichero de imagen (máx 5 MB)" }
 *     responses:
 *       201: { description: Imagen subida, devuelve { url } para guardar en el campo imagen }
 *       400: { description: No es imagen o supera 5 MB }
 *       401: { description: Falta token }
 *       403: { description: Sin permisos (rol cliente) }
 */
router.post('/', proteger, soloRoles('admin', 'pastelero'), (req, res) => {
  upload.single('imagen')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Falta el campo "imagen" o el fichero no es una imagen válida' });
    res.status(201).json({ url: `/uploads/${req.file.filename}`, nombre: req.file.filename });
  });
});

export default router;
