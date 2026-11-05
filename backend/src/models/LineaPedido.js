import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const LineaPedido = sequelize.define('LineaPedido', {
    id_linea: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    }, 
    id_pedido: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id_producto: {
        type: DataTypes.INTEGER,
        allowNull: false, 
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    precio_unitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
}, {
    tableName: 'lineas_pedido',
    timestamps: false,
});

export default LineaPedido;