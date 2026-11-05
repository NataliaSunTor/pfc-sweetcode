import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  apellidos: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
  },
  telefono: {
    type: DataTypes.STRING(45),
  },
  password_hash: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  rol: {
    type: DataTypes.STRING(45),
    allowNull: false,
    defaultValue: 'cliente',
  },
  fecha_alta: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  ultimo_acceso: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  activo: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  tableName: 'usuarios',
  timestamps: false,
  defaultScope: {
    attributes: { exclude: ['password_hash'] },
  },
  scopes: {
    conHash: {
      attributes: { include: ['password_hash'] },
    },
  },
});

export default Usuario;