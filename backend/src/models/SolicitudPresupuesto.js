import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SolicitudPresupuesto = sequelize.define('SolicitudPresupuesto', {
    id_presupuesto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id_pedido: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    tipo_evento: {
        type: DataTypes.STRING(45),
        allowNull: false,
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    precio_estimado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    fecha_entrega: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    estado: {
        type: DataTypes.STRING(45),
        allowNull: false,
    },
}, {
    tableName: 'solicitudes_presupuesto',
    timestamps: false,
});

export default SolicitudPresupuesto;