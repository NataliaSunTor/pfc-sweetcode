import { Sequelize } from 'sequelize';
const sequelize = new Sequelize(
  process.env.DB_NAME,      // sweetcode
  process.env.DB_USER,       // el usuario del compose
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'mysql',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,   // Habría que cambiar a true si se quiere ver las queries SQL
  }
);

export async function authenticate() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL establecida correctamente.');
  } catch (err) {
    console.error('No se puede conectar a la base de datos:', err);
    throw err;
  }
}

export { sequelize };
export default sequelize;