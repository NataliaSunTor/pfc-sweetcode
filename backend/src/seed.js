import 'dotenv/config';

import sequelize from './config/db.js';

import Usuario from './models/Usuario.js';
import Producto from './models/Producto.js';
import Categoria from './models/Categoria.js';
import bcrypt from 'bcrypt';
import DireccionEntrega from './models/DireccionEntrega.js';
import SolicitudPresupuesto from './models/SolicitudPresupuesto.js';
import Articulo from './models/Articulo.js';
import Pedido from './models/Pedido.js';
import LineaPedido from './models/LineaPedido.js';

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
const dias = (n) => new Date(ahora.getTime() - n * 24 * 60 * 60 * 1000);

const ejecutar = async () => {
  try {
    await sequelize.authenticate();

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const tabla of TABLAS) await sequelize.query(`TRUNCATE TABLE \`${tabla}\``);
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Tablas vaciadas:', TABLAS.join(', '));

    // 1) Usuarios demo (admin, pastelero y dos clientes)
    const usuarios = [
      { nombre: 'Admin', apellidos: 'SweetCode', email: 'adming@testing.com', rol: 'admin', password: 'admin123' },
      { nombre: 'Paco', apellidos: 'Pastelero', email: 'pastelero@testing.com', rol: 'pastelero', password: 'pastelero123' },
      { nombre: 'Natalia', apellidos: 'Cliente', email: 'cliente@testing.com', rol: 'cliente', password: 'cliente123', telefono: '600111222' },
      { nombre: 'Luis', apellidos: 'Gómez', email: 'luis@testing.com', rol: 'cliente', password: 'cliente123', telefono: '600333444' },
    ];
    for (const u of usuarios) {
      const { password, ...datos } = u; // fuera el password en claro
      await Usuario.create({
        ...datos,
        password_hash: await bcrypt.hash(password, 10),
        fecha_alta: ahora,
        ultimo_acceso: ahora, // NOT NULL en la tabla: hay que darle valor
        activo: 1,
      });
    }
    console.log('✅ Usuarios demo creados (admin: adming@testing.com)');

    // 2) Categorías
    const categoriasSeed = [
      { nombre: 'Tartas', descripcion: 'Tartas de la casa' },
      { nombre: 'Galletas', descripcion: 'Galletas artesanas' },
      { nombre: 'Chocolates', descripcion: 'Especialidades de chocolate' },
      { nombre: 'Individuales', descripcion: 'Piezas y raciones individuales' },
    ];
    const ids = {};
    for (const c of categoriasSeed) {
      const cat = await Categoria.create(c);
      ids[c.nombre] = cat.id_categoria;
    }
    console.log('✅ Categorías seed completadas:', ids);

    // 3) Productos — con imagen, id_categoria, iva, stock, fecha_alta
    //    imagen apunta a los ficheros incluidos en backend/uploads/
    const productos = [
      { nombre: 'Tarta de queso',              descripcion: 'Asturiana, al horno',                              precio: 18.50, iva: 10.00, stock: 12, categoria: 'Tartas',       imagen: '/uploads/tarta_queso.jpg' },
      { nombre: 'Tarta personalizada',         descripcion: 'Con foto y mensaje, encargos con 48h de aviso',    precio: 25.00, iva: 10.00, stock: 5,  categoria: 'Tartas',       imagen: '/uploads/tarta_personalizada.png' },
      { nombre: 'Brownie',                     descripcion: 'Intenso, con nueces y cobertura de chocolate',      precio: 2.50,  iva: 10.00, stock: 24, categoria: 'Individuales',  imagen: '/uploads/brownies.jpg' },
      { nombre: 'Rocas de chocolate',          descripcion: 'Crujientes, con almendra y cacao puro',            precio: 6.50,  iva: 10.00, stock: 30, categoria: 'Chocolates',   imagen: '/uploads/rocas_chocolate.jpg' },
      { nombre: 'Calendario de adviento',      descripcion: '24 bombones para contar los días',                 precio: 32.00, iva: 10.00, stock: 10, categoria: 'Chocolates',   imagen: '/uploads/calendario_adviento.png' },
      { nombre: 'Roscón de Reyes',             descripcion: 'Horneado el 5 de enero, con nata o trufa',         precio: 14.50, iva: 10.00, stock: 8,  categoria: 'Tartas',       imagen: '/uploads/roscon.jpg' },
      { nombre: 'Galletas',                     descripcion: 'Mezcla de vainilla, chocolate y mantequilla',      precio: 3.50,  iva: 10.00, stock: 40, categoria: 'Galletas',     imagen: '/uploads/galletas.jpg' },
    ];
    const idProd = {};
    for (const p of productos) {
      const { categoria, ...datos } = p; // separa la categoría del resto
      const prod = await Producto.create({ ...datos, id_categoria: ids[categoria], activo: 1, fecha_alta: dias(20) });
      idProd[p.nombre] = prod.id_producto;
    }
    console.log('✅ Productos seed completados (7 con imagen)');

    // 4) Direcciones de entrega
    const cliente = await Usuario.findOne({ where: { email: 'cliente@testing.com' } });
    const luis = await Usuario.findOne({ where: { email: 'luis@testing.com' } });
    const dirCliente = await DireccionEntrega.create({
      id_usuario: cliente.id_usuario,
      calle: 'Calle del Azúcar 12',
      ciudad: 'Oviedo',
      codigo_postal: '33001',
      pais: 'España',
      principal: 1,
    });
    const dirLuis = await DireccionEntrega.create({
      id_usuario: luis.id_usuario,
      calle: 'Avenida de la Crema 4',
      ciudad: 'Gijón',
      codigo_postal: '33201',
      pais: 'España',
      principal: 1,
    });
    console.log('✅ Direcciones creadas');

    // 5) Pedidos con sus líneas (los totales los calcula el seed igual que haría la API)
    const pedidosSeed = [
      {
        usuario: cliente, direccion: dirCliente, fecha: dias(7), estado: 'entregado',
        observaciones: 'Entregar por la tarde, por favor',
        items: [
          { id: idProd['Tarta de queso'], cantidad: 2, precio: 18.50 },
          { id: idProd['Galletas'], cantidad: 6, precio: 3.50 },
        ],
      },
      {
        usuario: cliente, direccion: dirCliente, fecha: dias(2), estado: 'enviado',
        items: [
          { id: idProd['Brownie'], cantidad: 3, precio: 2.50 },
          { id: idProd['Rocas de chocolate'], cantidad: 2, precio: 6.50 },
        ],
      },
      {
        usuario: luis, direccion: dirLuis, fecha: dias(1), estado: 'pendiente',
        observaciones: 'Para el sábado por la mañana',
        items: [
          { id: idProd['Roscón de Reyes'], cantidad: 1, precio: 14.50 },
        ],
      },
      {
        usuario: luis, direccion: dirLuis, fecha: dias(15), estado: 'cancelado',
        items: [
          { id: idProd['Calendario de adviento'], cantidad: 2, precio: 32.00 },
        ],
      },
    ];
    for (const p of pedidosSeed) {
      const importeTotal = p.items.reduce((acc, i) => acc + i.cantidad * i.precio, 0);
      const pedido = await Pedido.create({
        id_usuario: p.usuario.id_usuario,
        id_direccion: p.direccion.id_direccion,
        fecha: p.fecha,
        estado: p.estado,
        importe_total: importeTotal.toFixed(2),
        observaciones: p.observaciones || null,
      });
      for (const i of p.items) {
        await LineaPedido.create({
          id_pedido: pedido.id_pedido,
          id_producto: i.id,
          cantidad: i.cantidad,
          precio_unitario: i.precio,
          subtotal: (i.cantidad * i.precio).toFixed(2),
        });
      }
    }
    console.log('✅ Pedidos demo creados (entregado, enviado, pendiente y cancelado)');

    // 6) Solicitudes de presupuesto en varios estados
    await SolicitudPresupuesto.create({
      id_usuario: cliente.id_usuario,
      id_pedido: null,
      fecha: dias(3),
      tipo_evento: 'boda',
      descripcion: 'Tarta de 3 pisos para 60 personas',
      precio_estimado: null,
      fecha_entrega: new Date('2026-12-20T12:00:00'),
      estado: 'pendiente',
    });
    await SolicitudPresupuesto.create({
      id_usuario: luis.id_usuario,
      id_pedido: null,
      fecha: dias(5),
      tipo_evento: 'comunion',
      descripcion: 'Tarta temática de fútbol para 25 niños',
      precio_estimado: 85.00,
      fecha_entrega: new Date('2026-12-05T12:00:00'),
      estado: 'presupuestado',
    });
    await SolicitudPresupuesto.create({
      id_usuario: cliente.id_usuario,
      id_pedido: null,
      fecha: dias(10),
      tipo_evento: 'aniversario',
      descripcion: 'Mesa dulce para 30 personas con tarta de queso incluida',
      precio_estimado: 120.00,
      fecha_entrega: new Date('2026-12-28T18:00:00'),
      estado: 'aceptado',
    });
    console.log('✅ Presupuestos demo creados (pendiente, presupuestado y aceptado)');

    // 7) Artículos de blog (uno publicado y uno en borrador, para ver el flujo staff)
    const admin = await Usuario.findOne({ where: { email: 'adming@testing.com' } });
    await Articulo.create({
      id_usuario: admin.id_usuario,
      id_categoria: ids['Tartas'],
      titulo: 'Cómo conservar una tarta de queso',
      contenido: 'La tarta de queso aguanta 3 días en la nevera, tapada con film o en su caja. Al día siguiente está aún mejor reposada.',
      etiquetas: 'consejos,tartas',
      publicado: 1,
      fecha: dias(12),
    });
    await Articulo.create({
      id_usuario: admin.id_usuario,
      id_categoria: ids['Galletas'],
      titulo: 'Receta: galletas de mantequilla en casa (borrador)',
      contenido: 'Amasado, reposo en frío y horneado paso a paso, con fotos del proceso...',
      etiquetas: 'recetas,galletas',
      publicado: 0, // solo lo ve el staff
      fecha: dias(1),
    });
    console.log('✅ Artículos demo creados (uno publicado y un borrador)');

    console.log('✅ Seed completado');
    process.exit(0);
  } catch (err) {
    console.error('Error en seed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

ejecutar();
