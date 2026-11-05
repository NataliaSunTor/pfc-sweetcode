// src/models/relaciones.js
import Categoria from './Categoria.js';
import Producto from './Producto.js';
import Pedido from './Pedido.js';
import Usuario from './Usuario.js';
import LineaPedido from './LineaPedido.js';
import DireccionEntrega from './DireccionEntrega.js';
import SolicitudPresupuesto from './SolicitudPresupuesto.js';
import Articulo from './Articulo.js';

Categoria.hasMany(Producto, { foreignKey: 'id_categoria', as: 'producto' });
Producto.belongsTo(Categoria, { foreignKey: 'id_categoria', as: 'categoria' });

Usuario.hasMany(Pedido, { foreignKey: 'id_usuario', as: 'pedido' });
Pedido.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

Pedido.hasMany(LineaPedido, { foreignKey: 'id_pedido', as: 'lineas_pedido' });
LineaPedido.belongsTo(Pedido, { foreignKey: 'id_pedido', as: 'pedido' });


Producto.hasMany(LineaPedido, { foreignKey: 'id_producto', as: 'lineas_pedido' });
LineaPedido.belongsTo(Producto, { foreignKey: 'id_producto', as: 'producto' });

Usuario.hasMany(DireccionEntrega, { foreignKey: 'id_usuario', as: 'direccion' });
DireccionEntrega.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

DireccionEntrega.hasMany(Pedido, { foreignKey: 'id_direccion', as: 'pedidos' });
Pedido.belongsTo(DireccionEntrega, { foreignKey: 'id_direccion', as: 'direccion' });

Usuario.hasMany(SolicitudPresupuesto, { foreignKey: 'id_usuario', as: 'solicitud_presupuesto' });
SolicitudPresupuesto.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

Pedido.hasMany(SolicitudPresupuesto, { foreignKey: 'id_pedido', as: 'solicitud_presupuesto' });
SolicitudPresupuesto.belongsTo(Pedido, { foreignKey: 'id_pedido', as: 'pedido' });

Usuario.hasMany(Articulo, { foreignKey: 'id_usuario', as: 'articulos' });
Articulo.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

Categoria.hasMany(Articulo, { foreignKey: 'id_categoria', as: 'articulos' });
Articulo.belongsTo(Categoria, { foreignKey: 'id_categoria', as: 'categoria' });