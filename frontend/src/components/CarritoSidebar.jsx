import { Offcanvas } from 'react-bootstrap';
import { useCart } from '../context/CartContext.jsx';
import CarritoContenido from './CarritoContenido.jsx';

// Sidebar lateral del carrito (solo se abre en desktop; en móvil se usa /carrito)
export default function CarritoSidebar() {
  const { sidebarAbierto, cerrarSidebar } = useCart();

  return (
    <Offcanvas show={sidebarAbierto} onHide={cerrarSidebar} placement="end" className="sc-sidebar-carrito">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title className="sc-titulo h5">Tu carrito</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <CarritoContenido alTerminar={cerrarSidebar} />
      </Offcanvas.Body>
    </Offcanvas>
  );
}
