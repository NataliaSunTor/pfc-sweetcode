import { Col, Container, Row } from 'react-bootstrap';
import fotoNatalia from '../assets/natalia.jpg';
import fotoTrabajo from '../assets/forma_trabajar.jpg';

export default function SobreNosotros() {
  return (
    <Container className="py-5">
      <h1 className="sc-titulo mb-4">Sobre nosotros</h1>

      {/* Quién hay detrás: texto a la izquierda, foto a la derecha */}
      <Row className="g-5 align-items-center mb-5">
        <Col md={7}>
          <h2 className="sc-titulo h4 mb-3">Quién hay detrás</h2>
          <p>
            <strong>Natalia</strong>, pastelera y desarrolladora web, lleva los
            mandos de este proyecto.
          </p>
          <p>
            Su camino empezó en la hostelería con solo 18 años, hasta descubrir
            que su verdadera vocación era la pastelería. Durante cinco años
            perfeccionó su oficio en algunos de los mejores hoteles de Londres,
            y después regresó a España para especializarse en chocolatería.
          </p>
          <p>
            Paralelamente, otra pasión fue creciendo: el desarrollo web. Lo que
            empezó como un hobby terminó convirtiéndose en una segunda
            profesión.
          </p>
          <p>
            <strong>SweetCode</strong> nace de la unión de ambos mundos: la
            creatividad de la pastelería artesanal y la precisión del código.
            Esta web, diseñada íntegramente por ella, es el reflejo de años de
            trabajo en los dos sectores.
          </p>
        </Col>
        <Col md={5} className="text-center">
          <img
            src={fotoNatalia}
            alt="Natalia, pastelera y desarrolladora web, fundadora de SweetCode"
            className="sc-foto-seccion img-fluid"
          />
        </Col>
      </Row>

      <hr className="my-5" />

      {/* Nuestra forma de trabajar: foto a la izquierda, texto a la derecha */}
      <Row className="g-5 align-items-center">
        <Col md={5} className="text-center order-md-first">
          <img
            src={fotoTrabajo}
            alt="Dulces artesanales elaborados a mano por encargo"
            className="sc-foto-seccion img-fluid"
          />
        </Col>
        <Col md={7}>
          <h2 className="sc-titulo h4 mb-3">Nuestra forma de trabajar</h2>
          <p>
            Trabajamos por encargo: cada dulce se prepara a mano desde Noves
            (Toledo) y lo recoges en mano en el día y hora que acordemos.
          </p>
          <p>
            Usamos ingredientes de proximidad y cada encargo se elabora
            pensando en la persona que lo va a disfrutar: sin prisas, sin
            producciones en serie.
          </p>
        </Col>
      </Row>
    </Container>
  );
}