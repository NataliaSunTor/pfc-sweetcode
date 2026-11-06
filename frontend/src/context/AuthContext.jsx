import { createContext, useContext, useEffect, useState } from 'react';
import { get, post, getToken, setToken, getUsuarioGuardado, setUsuarioGuardado } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(getUsuarioGuardado);
  // Si hay token guardado, validamos la sesión contra el backend al arrancar
  const [cargando, setCargando] = useState(() => Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    get('/api/auth/perfil')
      .then((u) => {
        setUsuario(u);
        setUsuarioGuardado(u);
      })
      .catch(() => {
        setUsuario(null);
        setUsuarioGuardado(null);
        setToken(null);
      })
      .finally(() => setCargando(false));
  }, []);

  async function entrar(email, password) {
    const { token } = await post('/api/auth/login', { email, password }, { auth: false });
    setToken(token);
    const u = await get('/api/auth/perfil');
    setUsuario(u);
    setUsuarioGuardado(u);
    return u;
  }

  async function registrar(datos) {
    const { token } = await post('/api/auth/registro', datos, { auth: false });
    setToken(token);
    const u = await get('/api/auth/perfil');
    setUsuario(u);
    setUsuarioGuardado(u);
    return u;
  }

  function salir() {
    setToken(null);
    setUsuarioGuardado(null);
    setUsuario(null);
  }

  function actualizarUsuario(u) {
    setUsuario(u);
    setUsuarioGuardado(u);
  }

  const rol = usuario?.rol ?? null;
  const esStaff = rol === 'admin' || rol === 'pastelero';

  const value = { usuario, rol, esStaff, cargando, entrar, registrar, salir, actualizarUsuario };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
