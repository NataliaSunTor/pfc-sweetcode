import { Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="sc-footer mt-auto">
      <Container className="py-4">
        <Row className="gy-3">
          <Col md={4}>
            <h5 className="sc-brand-footer">SweetCode</h5>
            <p className="mb-0">Pastelería artesanal. Tartas y dulces hechos a mano, con ingredientes de proximidad.</p>
          </Col>
          <Col md={4}>
            <h6>Enlaces</h6>
            <ul className="list-unstyled mb-0">
              <li><Link to="/tienda">Tienda</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/contacto">Contacto</Link></li>
            </ul>
          </Col>
          <Col md={4}>
            <h6>Horario</h6>
            <p className="mb-0">Lunes a sábado, 9:00 — 20:00</p>
          </Col>
        </Row>
        <hr />
        <p className="text-center mb-0 small">© {new Date().getFullYear()} SweetCode — PFC DAW</p>
      </Container>
    </footer>
  );
}
