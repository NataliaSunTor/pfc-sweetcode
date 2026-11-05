import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sweetcode-secreto-desarrollo';

export const generarToken = (usuario) =>
  jwt.sign(
    { id_usuario: usuario.id_usuario, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

export { JWT_SECRET };
