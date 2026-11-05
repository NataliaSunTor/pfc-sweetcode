import 'dotenv/config';
import sequelize from './config/db.js';
import Usuario from './models/Usuario.js';
import Producto from './models/Producto.js';
import Categoria from './models/Categoria.js';
import bcrypt from 'bcrypt';
import DireccionEntrega from './models/DireccionEntrega.js';
import Pedido from './models/Pedido.js';
import LineaPedido from './models/LineaPedido.js';
import SolicitudPresupuesto from './models/SolicitudPresupuesto.js';
import Articulo from './models/Articulo.js';

const ahora = new Date(); // fecha_alta y ultimo_acceso para todos

const ejecutar = async () => {
  try {
    await sequelize.authenticate();
    // ❌ eliminado sequelize.sync(): la estructura ahora la manda el EER

    // 1) Categorías (van primero: los productos las necesitan)
    const categoriasSeed = [
      { nombre: 'tartas', descripcion: 'Tartas de la casa' },
      { nombre: 'bolleria', descripcion: 'Bollería recién hecha' },
      { nombre: 'encargos', descripcion: 'Encargos personalizados' },
    ];
    const ids = {};
    for (const c of categoriasSeed) {
      const [cat] = await Categoria.findOrCreate({ where: { nombre: c.nombre }, defaults: c });
      ids[c.nombre] = cat.id_categoria;
    }
    console.log('✅ Categorías seed completadas:', ids);

    // 2) Productos — ahora con id_categoria, iva, stock, fecha_alta
    const productos = [
      { nombre: 'Tarta de queso', descripcion: 'Asturiana, al horno', precio: 18.50, iva: 10.00, stock: 12, categoria: 'tartas' },
      { nombre: 'Croissant de mantequilla', descripcion: 'De mantequilla francesa', precio: 1.40, iva: 10.00, stock: 30, categoria: 'bolleria' },
      { nombre: 'Tarta de cumpleaños personalizada', descripcion: 'Con foto y mensaje', precio: 25.00, iva: 10.00, stock: 0, categoria: 'encargos' },
    ];
    for (const p of productos) {
      const { categoria, ...datos } = p; // separa la categoría del resto
      await Producto.findOrCreate({
        where: { nombre: datos.nombre },
        defaults: { ...datos, id_categoria: ids[categoria], activo: 1, fecha_alta: ahora },
      });
    }

    // 3) Usuarios — con las columnas nuevas
    const usuarios = [
      { nombre: 'Admin', apellidos: 'SweetCode', email: 'nataliasuer@gmail.com', rol: 'admin', password: 'admin123' },
      { nombre: 'Paco', apellidos: 'Pastelero', email: 'pastelero@testing.com', rol: 'pastelero', password: 'pastelero123' },
      { nombre: 'Natalia', apellidos: 'Cliente', email: 'cliente@testing.com', rol: 'cliente', password: 'cliente123' },
    ];
    for (const u of usuarios) {
      const { password, ...datos } = u; // fuera el password en claro
      await Usuario.findOrCreate({
        where: { email: datos.email },
        defaults: {
          ...datos,
          password_hash: await bcrypt.hash(password, 10),
          telefono: null,
          fecha_alta: ahora,
          ultimo_acceso: ahora, // NOT NULL en la tabla: hay que darle valor
          activo: 1,
        },
      });
    }

        // 4) Dirección de entrega del cliente
    const cliente = await Usuario.findOne({ where: { email: 'cliente@testing.com' } });
    const [direccion] = await DireccionEntrega.findOrCreate({
      where: { id_usuario: cliente.id_usuario, calle: 'Calle del Azúcar 12' },
      defaults: {
        id_usuario: cliente.id_usuario,
        calle: 'Calle del Azúcar 12',
        ciudad: 'Oviedo',
        codigo_postal: '33001',
        pais: 'España',
        principal: 1,
      },
    });

    // 5) Pedido del cliente con dos líneas
    const tarta = await Producto.findOne({ where: { nombre: 'Tarta de queso' } });
    const croissant = await Producto.findOne({ where: { nombre: 'Croissant de mantequilla' } });
    const lineas = [
      { producto: tarta, cantidad: 1 },
      { producto: croissant, cantidad: 6 },
    ];
    const importeTotal = lineas.reduce((acc, l) => acc + l.cantidad * Number(l.producto.precio), 0);
    const [pedido] = await Pedido.findOrCreate({
      where: { id_usuario: cliente.id_usuario, estado: 'pendiente' },
      defaults: {
        id_usuario: cliente.id_usuario,
        id_direccion: direccion.id_direccion,
        fecha: ahora,
        estado: 'pendiente',
        importe_total: importeTotal.toFixed(2),
        observaciones: 'Sin gluten si es posible',
      },
    });
    for (const l of lineas) {
      await LineaPedido.findOrCreate({
        where: { id_pedido: pedido.id_pedido, id_producto: l.producto.id_producto },
        defaults: {
          id_pedido: pedido.id_pedido,
          id_producto: l.producto.id_producto,
          cantidad: l.cantidad,
          precio_unitario: l.producto.precio,
          subtotal: (l.cantidad * Number(l.producto.precio)).toFixed(2),
        },
      });
    }

    // 6) Solicitud de presupuesto de ejemplo (sin pedido todavía)
    await SolicitudPresupuesto.findOrCreate({
      where: { id_usuario: cliente.id_usuario, tipo_evento: 'boda' },
      defaults: {
        id_usuario: cliente.id_usuario,
        id_pedido: null,
        fecha: ahora,
        tipo_evento: 'boda',
        descripcion: 'Tarta de 3 pisos para 60 personas',
        precio_estimado: null,
        fecha_entrega: new Date('2026-12-20T12:00:00'),
        estado: 'pendiente',
      },
    });

    // 7) Artículo de blog de ejemplo
    const admin = await Usuario.findOne({ where: { email: 'nataliasuer@gmail.com' } });
    await Articulo.findOrCreate({
      where: { titulo: 'Cómo conservar una tarta de queso' },
      defaults: {
        id_usuario: admin.id_usuario,
        id_categoria: ids['tartas'],
        titulo: 'Cómo conservar una tarta de queso',
        contenido: 'La tarta de queso aguanta 3 días en la nevera, tapada...',
        etiquetas: 'consejos,tartas',
        publicado: 1,
        fecha: ahora,
      },
    });
    console.log('✅ Pedido seed:', pedido.id_pedido, 'importe:', importeTotal.toFixed(2));

    console.log('✅ Seed completado');
    process.exit(0);
  } catch (err) {
    console.error('Error en seed:', err.message);
    process.exit(1);
  }
};

ejecutar();