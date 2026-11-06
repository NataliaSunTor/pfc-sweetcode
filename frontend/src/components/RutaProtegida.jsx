import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Cargando } from './Estado.jsx';

// Envuelve rutas que exigen sesión iniciada
export default function RutaProtegida() {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return <Cargando texto="Comprobando sesión…" />;
  if (!usuario) return <Navigate to="/login" state={{ volver: location.pathname }} replace />;
  return <Outlet />;
}
