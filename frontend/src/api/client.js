// Único punto de acceso a la API del backend.
// Inyecta el JWT, serializa JSON y, ante un 401, limpia la sesión y manda a /login.

// URL de la API. En el PC hostname = "localhost"; desde el móvil (misma WiFi) hostname es
// la IP del PC (p. ej. 192.168.1.37), así que las llamadas llegan al backend igualmente.
// Se puede forzar con la variable VITE_API_URL al arrancar/build.
export const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000`;
const TOKEN_KEY = 'sc_token';
const USUARIO_KEY = 'sc_usuario';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getUsuarioGuardado() {
  try {
    return JSON.parse(localStorage.getItem(USUARIO_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setUsuarioGuardado(usuario) {
  if (usuario) localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
  else localStorage.removeItem(USUARIO_KEY);
}

function limpiarSesion() {
  setToken(null);
  setUsuarioGuardado(null);
}

export async function api(path, { method = 'GET', body, formData, auth = true } = {}) {
  const headers = {};
  if (auth && getToken()) headers['Authorization'] = `Bearer ${getToken()}`;

  let payload;
  if (formData) {
    payload = formData; // el navegador pone el Content-Type multipart con boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });

  if (res.status === 401 && auth) {
    limpiarSesion();
    if (window.location.pathname !== '/login') window.location.href = '/login';
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // respuesta sin cuerpo (204, etc.)
  }

  if (!res.ok) {
    throw new Error(data?.error || `Error ${res.status} en ${method} ${path}`);
  }
  return data;
}

export const get = (path, opts) => api(path, { ...opts, method: 'GET' });
export const post = (path, body, opts) => api(path, { ...opts, method: 'POST', body });
export const put = (path, body, opts) => api(path, { ...opts, method: 'PUT', body });
export const del = (path, opts) => api(path, { ...opts, method: 'DELETE' });
export const postForm = (path, formData, opts) => api(path, { ...opts, method: 'POST', formData });
