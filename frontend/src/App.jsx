import { Route, Routes } from 'react-router-dom';
import Layout from './layout/Layout.jsx';
import AdminLayout from './layout/AdminLayout.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import RutaStaff from './components/RutaStaff.jsx';
import Inicio from './pages/Inicio.jsx';
import Tienda from './pages/Tienda.jsx';
import ProductoDetalle from './pages/ProductoDetalle.jsx';
import Blog from './pages/Blog.jsx';
import ArticuloDetalle from './pages/ArticuloDetalle.jsx';
import Carrito from './pages/Carrito.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import MiCuenta from './pages/MiCuenta.jsx';
import AdminInicio from './pages/admin/AdminInicio.jsx';
import AdminProductos from './pages/admin/AdminProductos.jsx';
import AdminPedidos from './pages/admin/AdminPedidos.jsx';
import AdminPresupuestos from './pages/admin/AdminPresupuestos.jsx';
import AdminUsuarios from './pages/admin/AdminUsuarios.jsx';
import AdminArticulos from './pages/admin/AdminArticulos.jsx';
import { SobreNosotros, Contacto, NoEncontrada } from './pages/Paginas.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/tienda" element={<Tienda />} />
        <Route path="/tienda/:id" element={<ProductoDetalle />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<ArticuloDetalle />} />
        <Route path="/sobre-nosotros" element={<SobreNosotros />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        <Route element={<RutaProtegida />}>
          <Route path="/cuenta" element={<MiCuenta />} />
        </Route>

        <Route element={<RutaStaff />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminInicio />} />
            <Route path="/admin/productos" element={<AdminProductos />} />
            <Route path="/admin/pedidos" element={<AdminPedidos />} />
            <Route path="/admin/presupuestos" element={<AdminPresupuestos />} />
            <Route path="/admin/usuarios" element={<AdminUsuarios />} />
            <Route path="/admin/blog" element={<AdminArticulos />} />
          </Route>
        </Route>

        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
