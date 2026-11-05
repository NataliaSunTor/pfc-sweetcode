import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Pedido = sequelize.define('Pedido', {
  id_pedido: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_direccion: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  estado: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  importe_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  observaciones: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'pedidos',
  timestamps: false,
});

export default Pedido;
