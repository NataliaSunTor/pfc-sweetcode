import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Categoria = sequelize.define('Categoria', {
  id_categoria: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
}, {
  tableName: 'categorias',
  timestamps: false,
});

export default Categoria;