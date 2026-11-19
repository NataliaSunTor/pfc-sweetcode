import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import PanelVentas from '../../components/admin/PanelVentas.jsx';

// Panel de gráficos de ventas: solo rol admin (el enlace también se oculta en el menú)
export default function AdminVentas() {
  const { rol } = useAuth();
  if (rol !== 'admin') return <Navigate to="/admin" replace />;
  return <PanelVentas />;
}
