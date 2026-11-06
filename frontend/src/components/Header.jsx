import { Badge, Container, Nav, Navbar } from 'react-bootstrap';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { esEscritorio } from '../utils/escritorio.js';

const enlaces = [
  { to: '/', label: 'Inicio' },
  { to: '/tienda', label: 'Tienda' },
  { to: '/blog', label: 'Blog' },
  { to: '/sobre-nosotros', label: 'Sobre nosotros' },
  { to: '/contacto', label: 'Contacto' },
];

export default function Header() {
  const { usuario, esStaff } = useAuth();
  const { totalItems, abrirSidebar } = useCart();
  const navigate = useNavigate();

  // Desktop: el icono abre el sidebar; móvil: navega a la página /carrito
  function irAlCarrito(e) {
    if (esEscritorio()) {
      e.preventDefault();
      abrirSidebar();
    } else {
      navigate('/carrito');
    }
  }

  return (
    <Navbar expand="lg" sticky="top" className="sc-navbar" collapseOnSelect>
      <Container>
        <Navbar.Brand as={Link} to="/" className="sc-brand">
          SweetCode
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="menu-principal" />
        <Navbar.Collapse id="menu-principal">
          <Nav className="mx-auto">
            {enlaces.map((e) => (
              <Nav.Link key={e.to} as={NavLink} to={e.to} end={e.to === '/'}>
                {e.label}
              </Nav.Link>
            ))}
            {esStaff && (
              <Nav.Link as={NavLink} to="/admin" className="sc-enlace-panel">
                Panel
              </Nav.Link>
            )}
          </Nav>
          <Nav className="align-items-lg-center gap-lg-2">
            <Nav.Link
              as={Link}
              to={usuario ? '/cuenta' : '/login'}
              title={usuario ? `${usuario.nombre} — Mi cuenta` : 'Entrar'}
              className="sc-icono"
            >
              <FaUserCircle size={22} />
              <span className="d-lg-none ms-2">{usuario ? 'Mi cuenta' : 'Entrar'}</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/carrito" onClick={irAlCarrito} title="Carrito" className="sc-icono position-relative">
              <FaShoppingCart size={20} />
              {totalItems > 0 && (
                <Badge pill bg="danger" className="sc-badge-carrito">
                  {totalItems}
                </Badge>
              )}
              <span className="d-lg-none ms-2">Carrito</span>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
