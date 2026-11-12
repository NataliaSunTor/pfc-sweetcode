import { Col, Container, Nav, Row } from 'react-bootstrap';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminLayout() {
  const { rol } = useAuth();

  return (
    <Container fluid="lg" className="py-4">
      <h1 className="sc-titulo h3 mb-4">Panel de gestión</h1>
      <Row>
        <Col lg={3} className="mb-3">
          <Nav className="sc-admin-nav flex-nowrap">
            <Nav.Link as={NavLink} to="/admin" end>Inicio</Nav.Link>
            <Nav.Link as={NavLink} to="/admin/productos">Productos</Nav.Link>
            <Nav.Link as={NavLink} to="/admin/blog">Blog</Nav.Link>
            <Nav.Link as={NavLink} to="/admin/pedidos">Pedidos</Nav.Link>
            <Nav.Link as={NavLink} to="/admin/presupuestos">Presupuestos</Nav.Link>
            {rol === 'admin' && <Nav.Link as={NavLink} to="/admin/usuarios">Usuarios</Nav.Link>}
          </Nav>
        </Col>
        <Col lg={9}>
          <Outlet />
        </Col>
      </Row>
    </Container>
  );
}
