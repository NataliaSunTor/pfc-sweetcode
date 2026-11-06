import { Badge, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { fmtFecha } from '../utils/format.js';

export default function TarjetaArticulo({ articulo }) {
  const extracto =
    articulo.contenido.length > 140 ? `${articulo.contenido.slice(0, 140)}…` : articulo.contenido;

  return (
    <Card className="h-100 sc-tarjeta">
      <Card.Body className="d-flex flex-column">
        <div className="d-flex align-items-center gap-2 mb-2">
          {articulo.categoria && (
            <Badge bg="secondary" className="sc-badge-categoria">
              {articulo.categoria.nombre}
            </Badge>
          )}
          <small className="text-muted">{fmtFecha(articulo.fecha)}</small>
        </div>
        <Card.Title as="h3" className="h5 sc-tarjeta-titulo">
          {articulo.titulo}
        </Card.Title>
        <Card.Text className="text-muted flex-grow-1">{extracto}</Card.Text>
        <Button
          as={Link}
          to={`/blog/${articulo.id_articulos}`}
          variant="outline-marron"
          size="sm"
          className="align-self-start"
        >
          Leer artículo
        </Button>
      </Card.Body>
    </Card>
  );
}
