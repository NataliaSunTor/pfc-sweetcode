import { useEffect, useState } from 'react';
import { Button, ButtonGroup, Col, Container, Row } from 'react-bootstrap';
import { get } from '../api/client.js';
import TarjetaProducto from '../components/TarjetaProducto.jsx';
import { Cargando, AlertaError } from '../components/Estado.jsx';

export default function Tienda() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([get('/api/productos'), get('/api/categorias')])
      .then(([prods, cats]) => {
        setProductos(prods);
        setCategorias(cats);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  const visibles = categoriaActiva
    ? productos.filter((p) => p.id_categoria === categoriaActiva)
    : productos;

  return (
    <Container className="py-5">
      <h1 className="sc-titulo mb-4">Tienda</h1>

      {cargando && <Cargando texto="Cargando catálogo…" />}
      <AlertaError error={error} />

      {!cargando && !error && (
        <>
          <ButtonGroup className="mb-4 flex-wrap">
            <Button
              variant={categoriaActiva === null ? 'caramelo' : 'outline-marron'}
              onClick={() => setCategoriaActiva(null)}
            >
              Todas
            </Button>
            {categorias.map((c) => (
              <Button
                key={c.id_categoria}
                variant={categoriaActiva === c.id_categoria ? 'caramelo' : 'outline-marron'}
                onClick={() => setCategoriaActiva(c.id_categoria)}
              >
                {c.nombre}
              </Button>
            ))}
          </ButtonGroup>

          {visibles.length === 0 ? (
            <p className="text-muted">No hay productos en esta categoría todavía.</p>
          ) : (
            <Row xs={1} sm={2} lg={3} xl={4} className="g-4">
              {visibles.map((p) => (
                <Col key={p.id_producto}>
                  <TarjetaProducto producto={p} />
                </Col>
              ))}
            </Row>
          )}
        </>
      )}
    </Container>
  );
}
