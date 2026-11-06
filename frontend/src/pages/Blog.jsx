import { useEffect, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { get } from '../api/client.js';
import TarjetaArticulo from '../components/TarjetaArticulo.jsx';
import { Cargando, AlertaError } from '../components/Estado.jsx';

export default function Blog() {
  const [articulos, setArticulos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    get('/api/articulos')
      .then(setArticulos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <Container className="py-5">
      <h1 className="sc-titulo mb-4">Blog</h1>
      {cargando && <Cargando texto="Cargando artículos…" />}
      <AlertaError error={error} />
      {!cargando && !error && articulos.length === 0 && (
        <p className="text-muted">Aún no hay artículos publicados.</p>
      )}
      <Row xs={1} md={2} lg={3} className="g-4">
        {articulos.map((a) => (
          <Col key={a.id_articulos}>
            <TarjetaArticulo articulo={a} />
          </Col>
        ))}
      </Row>
    </Container>
  );
}
