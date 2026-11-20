import { Col, Container, Row } from 'react-bootstrap';

// CONTENIDO PROVISIONAL: sustituir los textos cuando esté decidido el mensaje.
export default function SobreNosotros() {
  return (
    <Container className="py-5">
      <h1 className="sc-titulo mb-3">Sobre nosotros</h1>

      <Row className="g-4">
        <Col md={6}>
          <h2 className="h5">Quiénes somos</h2>
          <p>
            SweetCode es una pastelería artesanal con tienda online. Hacemos
            tartas, bollería y encargos personalizados a mano, con ingredientes
            de proximidad.
          </p>
        </Col>
        <Col md={6}>
          <h2 className="h5">Nuestra forma de trabajar</h2>
          <p>
            Trabajamos por encargo: cada dulce se prepara a mano desde Noves
            (Toledo) y lo recoges en mano en el día y hora que acordemos.
          </p>
        </Col>
      </Row>
    </Container>
  );
}