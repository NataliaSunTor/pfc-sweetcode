import { Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const TELEFONO = '+34 600 00 00 00'; // TODO: sustituir por el número real
const TELEFONO_ENLACE = TELEFONO.replace(/\s/g, '');

export default function Contacto() {
  return (
    <Container className="py-5">
      <h1 className="sc-titulo mb-3">Contacto</h1>
      <p className="text-muted mb-4">
        SweetCode es una tienda online: trabajamos por encargo y organizamos la
        recogida en mano de tus pedidos.
      </p>

      <Row className="g-4">
        <Col md={6}>
          <div className="sc-tarjeta p-4 h-100">
            <h2 className="h5">📞 Teléfono</h2>
            <p className="mb-0">
              <a href={`tel:${TELEFONO_ENLACE}`}>{TELEFONO}</a>
            </p>
            <p className="small text-muted mb-0 mt-2">
              Llámanos o escríbenos por WhatsApp para dudas y encargos.
            </p>
          </div>
        </Col>

        <Col md={6}>
          <div className="sc-tarjeta p-4 h-100">
            <h2 className="h5">📍 Dónde estamos</h2>
            <p className="mb-0">Noves (Toledo)</p>
            <p className="small text-muted mb-0 mt-2">
              No tenemos tienda física abierta al público: la entrega es por
              recogida en mano, concertando la hora por teléfono.
            </p>
          </div>
        </Col>
      </Row>

      <Row className="g-4 mt-0">
        <Col md={6}>
          <div className="sc-tarjeta p-4 h-100">
            <h2 className="h5">🕒 Horario de recogida</h2>
            <ul className="list-unstyled mb-0">
              <li><strong>Lunes a viernes:</strong> 9:00 – 20:00</li>
              <li>
                <strong>Sábados y domingos:</strong> solo recogidas por encargo,
                de 9:00 a 13:00
              </li>
            </ul>
          </div>
        </Col>

        <Col md={6}>
          <div className="sc-tarjeta p-4 h-100">
            <h2 className="h5">🎂 Encargos personalizados</h2>
            <p className="mb-2">
              ¿Tartas por encargo o celebraciones? Pídenos presupuesto desde la
              tienda y te respondemos lo antes posible.
            </p>
            <Link to="/tienda">Ir a la tienda</Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
}