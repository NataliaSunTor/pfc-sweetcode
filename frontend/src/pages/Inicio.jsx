import { useEffect, useState } from 'react';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { get } from '../api/client.js';
import TarjetaProducto from '../components/TarjetaProducto.jsx';
import TarjetaArticulo from '../components/TarjetaArticulo.jsx';
import { Cargando, AlertaError } from '../components/Estado.jsx';

export default function Inicio() {
  const [destacados, setDestacados] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([get('/api/productos'), get('/api/articulos')])
      .then(([productos, arts]) => {
        setDestacados(
          [...productos].sort((a, b) => new Date(b.fecha_alta) - new Date(a.fecha_alta)).slice(0, 4)
        );
        setArticulos(arts.slice(0, 3));
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <>
      <section className="sc-hero">
        <Container className="text-center">
          <h1 className="sc-hero-titulo">Dulces hechos a mano, cada día</h1>
          <p className="sc-hero-subtitulo">
            Tartas, bollería y encargos personalizados de nuestra pastelería artesanal.
          </p>
          <Button as={Link} to="/tienda" variant="caramelo" size="lg">
            Ver catálogo
          </Button>
        </Container>
      </section>

      <Container className="py-5">
        <h2 className="sc-titulo mb-4">Destacados</h2>
        {cargando && <Cargando />}
        <AlertaError error={error} />
        {!cargando && !error && (
          <Row xs={1} sm={2} lg={4} className="g-4">
            {destacados.map((p) => (
              <Col key={p.id_producto}>
                <TarjetaProducto producto={p} />
              </Col>
            ))}
          </Row>
        )}

        <div className="d-flex align-items-center justify-content-between mt-5 mb-4">
          <h2 className="sc-titulo mb-0">Últimos artículos</h2>
          <Button as={Link} to="/blog" variant="outline-marron" size="sm">
            Ver todo el blog
          </Button>
        </div>
        {!cargando && !error && (
          <Row xs={1} md={3} className="g-4">
            {articulos.map((a) => (
              <Col key={a.id_articulos}>
                <TarjetaArticulo articulo={a} />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </>
  );
}
