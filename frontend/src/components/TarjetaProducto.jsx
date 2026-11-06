import { Badge, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaBirthdayCake } from 'react-icons/fa';
import { urlImagen } from '../utils/imagen.js';
import { fmtPrecio } from '../utils/format.js';

export default function TarjetaProducto({ producto }) {
  const imagen = urlImagen(producto.imagen);

  return (
    <Card className="h-100 sc-tarjeta">
      {imagen ? (
        <Card.Img variant="top" src={imagen} alt={producto.nombre} className="sc-tarjeta-img" />
      ) : (
        <div className="sc-tarjeta-img sc-tarjeta-sin-imagen">
          <FaBirthdayCake size={42} />
        </div>
      )}
      <Card.Body className="d-flex flex-column">
        {producto.categoria && (
          <Badge bg="secondary" className="sc-badge-categoria align-self-start mb-2">
            {producto.categoria.nombre}
          </Badge>
        )}
        <Card.Title as="h3" className="h5 sc-tarjeta-titulo">
          {producto.nombre}
        </Card.Title>
        <Card.Text className="text-muted small flex-grow-1">{producto.descripcion}</Card.Text>
        <div className="d-flex align-items-center justify-content-between mt-2">
          <span className="sc-precio">{fmtPrecio(producto.precio)}</span>
          <Button as={Link} to={`/tienda/${producto.id_producto}`} variant="outline-marron" size="sm">
            Ver detalle
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
