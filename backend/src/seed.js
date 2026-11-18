import 'dotenv/config';

import sequelize from './config/db.js';

import Usuario from './models/Usuario.js';
import Producto from './models/Producto.js';
import Categoria from './models/Categoria.js';
import bcrypt from 'bcrypt';
import DireccionEntrega from './models/DireccionEntrega.js';
import SolicitudPresupuesto from './models/SolicitudPresupuesto.js';
import Articulo from './models/Articulo.js';

// Vacía todas las tablas (la estructura la manda el EER; aquí solo se limpian los datos)
const TABLAS = [
  'lineas_pedido',
  'pedidos',
  'solicitudes_presupuesto',
  'direcciones_entrega',
  'articulos',
  'productos',
  'categorias',
  'usuarios',
];

const ahora = new Date(); // fecha_alta y ultimo_acceso para todos

const ejecutar = async () => {
  try {
    await sequelize.authenticate();

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const tabla of TABLAS) await sequelize.query(`TRUNCATE TABLE \`${tabla}\``);
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Tablas vaciadas:', TABLAS.join(', '));

    // 1) Usuarios demo
    const usuarios = [
      { nombre: 'Admin', apellidos: 'SweetCode', email: 'nataliasuer@gmail.com', rol: 'admin', password: 'admin123' },
      { nombre: 'Paco', apellidos: 'Pastelero', email: 'pastelero@testing.com', rol: 'pastelero', password: 'pastelero123' },
      { nombre: 'Natalia', apellidos: 'Cliente', email: 'cliente@testing.com', rol: 'cliente', password: 'cliente123' },
    ];
    for (const u of usuarios) {
      const { password, ...datos } = u; // fuera el password en claro
      await Usuario.create({
        ...datos,
        password_hash: await bcrypt.hash(password, 10),
        telefono: null,
        fecha_alta: ahora,
        ultimo_acceso: ahora, // NOT NULL en la tabla: hay que darle valor
        activo: 1,
      });
    }
    console.log('✅ Usuarios demo creados');

    // 2) Categorías
    const categoriasSeed = [
      { nombre: 'tartas', descripcion: 'Tartas de la casa' },
      { nombre: 'bolleria', descripcion: 'Bollería recién hecha' },
      { nombre: 'encargos', descripcion: 'Encargos personalizados' },
    ];
    const ids = {};
    for (const c of categoriasSeed) {
      const cat = await Categoria.create(c);
      ids[c.nombre] = cat.id_categoria;
    }
    console.log('✅ Categorías seed completadas:', ids);

    // 3) Productos — con id_categoria, iva, stock, fecha_alta
    const productos = [
      { nombre: 'Tarta de queso', descripcion: 'Asturiana, al horno', precio: 18.50, iva: 10.00, stock: 12, categoria: 'tartas' },
      { nombre: 'Croissant de mantequilla', descripcion: 'De mantequilla francesa', precio: 1.40, iva: 10.00, stock: 30, categoria: 'bolleria' },
      { nombre: 'Tarta de cumpleaños personalizada', descripcion: 'Con foto y mensaje', precio: 25.00, iva: 10.00, stock: 0, categoria: 'encargos' },
    ];
    for (const p of productos) {
      const { categoria, ...datos } = p; // separa la categoría del resto
      await Producto.create({ ...datos, id_categoria: ids[categoria], activo: 1, fecha_alta: ahora });
    }
    console.log('✅ Productos seed completados');

    // 4) Dirección de entrega principal del cliente demo
    const cliente = await Usuario.findOne({ where: { email: 'cliente@testing.com' } });
    await DireccionEntrega.create({
      id_usuario: cliente.id_usuario,
      calle: 'Calle del Azúcar 12',
      ciudad: 'Oviedo',
      codigo_postal: '33001',
      pais: 'España',
      principal: 1,
    });
    console.log('✅ Dirección del cliente creada');

    // 5) Solicitud de presupuesto de ejemplo (pendiente, sin pedido todavía)
    await SolicitudPresupuesto.create({
      id_usuario: cliente.id_usuario,
      id_pedido: null,
      fecha: ahora,
      tipo_evento: 'boda',
      descripcion: 'Tarta de 3 pisos para 60 personas',
      precio_estimado: null,
      fecha_entrega: new Date('2026-12-20T12:00:00'),
      estado: 'pendiente',
    });
    console.log('✅ Presupuesto de ejemplo creado');

    // 6) Artículo de blog de ejemplo
    const admin = await Usuario.findOne({ where: { email: 'nataliasuer@gmail.com' } });
    await Articulo.create({
      id_usuario: admin.id_usuario,
      id_categoria: ids['tartas'],
      titulo: 'Cómo conservar una tarta de queso',
      contenido: 'La tarta de queso aguanta 3 días en la nevera, tapada...',
      etiquetas: 'consejos,tartas',
      publicado: 1,
      fecha: ahora,
    });
    console.log('✅ Artículo de ejemplo creado');

    console.log('✅ Seed completado');
    process.exit(0);
  } catch (err) {
    console.error('Error en seed:', err.message);
    process.exit(1);
  }
};

ejecutar();
