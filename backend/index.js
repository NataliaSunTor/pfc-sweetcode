import 'dotenv/config';
import express from 'express';
import sequelize from './src/config/db.js';
import Usuario from './src/models/Usuario.js';
import authRoutes from './src/routes/auth.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/config/swagger.js';
import productosRoutes from './src/routes/productos.js'
import pedidosRoutes from './src/routes/pedidos.js'
import direccionesRoutes from './src/routes/direcciones.js'
import presupuestosRoutes from './src/routes/presupuestos.js'
import articulosRoutes from './src/routes/articulos.js'


const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/productos', productosRoutes)
app.use('/api/pedidos', pedidosRoutes)
app.use('/api/direcciones', direccionesRoutes)
app.use('/api/presupuestos', presupuestosRoutes)
app.use('/api/articulos', articulosRoutes)

app.get('/', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ mensaje: 'SweetCode API conectada a MySQL 🎂', status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: 'No puedo conectar a la BD', detalle: err.message });
  }
});

app.get('/usuarios', async (req, res) => {
  const usuarios = await Usuario.findAll();
  res.json(usuarios);
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`SweetCode API listening on port ${PORT}`));