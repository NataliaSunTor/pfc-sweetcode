import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Cargando } from './Estado.jsx';

// Envuelve el panel /admin: solo admin o pastelero
export default function RutaStaff() {
  const { usuario, esStaff, cargando } = useAuth();

  if (cargando) return <Cargando texto="Comprobando sesión…" />;
  if (!usuario || !esStaff) return <Navigate to="/" replace />;
  return <Outlet />;
}
