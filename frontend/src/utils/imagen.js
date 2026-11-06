import { BASE_URL } from '../api/client.js';

// Convierte el campo `imagen` del backend en una URL pintable.
// El backend guarda rutas relativas tipo "/uploads/123.png".
export function urlImagen(imagen) {
  if (!imagen) return null;
  if (/^https?:\/\//.test(imagen)) return imagen;
  return `${BASE_URL}${imagen}`;
}
