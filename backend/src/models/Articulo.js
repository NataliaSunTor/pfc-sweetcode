import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Articulo = sequelize.define('Articulo', {
    id_articulos: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },id_categoria: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    titulo: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    contenido: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    etiquetas: {
        type: DataTypes.STRING(45),
        allowNull: false,
    },
    publicado: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false,
    }
}, {
    tableName: 'articulos',
    timestamps: false,
});

export default Articulo;