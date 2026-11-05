import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Producto = sequelize.define('Producto', {
  id_producto: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  iva: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  imagen: {
    type: DataTypes.STRING(45),
  },
  activo: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
  },
  fecha_alta: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  fecha_baja: {
    type: DataTypes.DATE,
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'productos',
  timestamps: false,
});

export default Producto;