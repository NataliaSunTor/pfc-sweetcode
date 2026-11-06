import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

import sequelize from './src/config/db.js';

import authRoutes from './src/routes/auth.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/config/swagger.js';
import productosRoutes from './src/routes/productos.js'
import pedidosRoutes from './src/routes/pedidos.js'
import direccionesRoutes from './src/routes/direcciones.js'
import presupuestosRoutes from './src/routes/presupuestos.js'
import articulosRoutes from './src/routes/articulos.js'
import categoriasRoutes from './src/routes/categorias.js'
import usuariosRoutes from './src/routes/usuarios.js'
import uploadRoutes from './src/routes/upload.js'

const app = express();
app.use(express.json());
// CORS: front en localhost (3000 = nginx del compose, 5173 = dev de Vite) y también desde
// la red local (el móvil entra por la IP del PC, ej. http://192.168.1.37:5173).
// OJO: con origin como función hay que llamar al callback, no devolver un booleano.
const esOrigenPermitido = (origin) =>
  !origin ||
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
  /^http:\/\/(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin);
app.use(cors({
  origin: (origin, cb) => cb(null, esOrigenPermitido(origin)),
}));

// Subidas de imágenes: se guardan en ./uploads y se sirven en /uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/productos', productosRoutes)
app.use('/api/pedidos', pedidosRoutes)
app.use('/api/direcciones', direccionesRoutes)
app.use('/api/presupuestos', presupuestosRoutes)
app.use('/api/articulos', articulosRoutes)
app.use('/api/categorias', categoriasRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/auth', authRoutes);

app.get('/', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ mensaje: 'SweetCode API conectada a MySQL', status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: 'No puedo conectar a la BD', detalle: err.message });
  }
});

export default app;
