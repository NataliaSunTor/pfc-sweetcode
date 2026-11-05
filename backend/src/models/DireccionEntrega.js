import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const DireccionEntrega = sequelize.define('DireccionEntrega', {
    id_direccion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    calle: {
        type: DataTypes.STRING(45),
        allowNull: false,
    },
    ciudad: {
        type: DataTypes.STRING(45),
        allowNull: false,
    },
    codigo_postal: {
        type: DataTypes.STRING(45),
        allowNull: false,
    },
    pais: {
        type: DataTypes.STRING(45),
        allowNull: false,
    },
    principal: {
        type: DataTypes.TINYINT(1),
        allowNull: false,
        defaultValue: 0,
    }
}, {
    tableName: 'direcciones_entrega',
    timestamps: false,
});

export default DireccionEntrega;