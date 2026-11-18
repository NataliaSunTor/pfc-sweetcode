import { useState } from 'react';
import { Badge, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaBirthdayCake, FaCartPlus, FaCheck } from 'react-icons/fa';
import { useCart } from '../context/CartContext.jsx';
import { urlImagen } from '../utils/imagen.js';
import { fmtPrecio } from '../utils/format.js';
import { esEscritorio } from '../utils/escritorio.js';

export default function TarjetaProducto({ producto }) {
  const { addItem, abrirSidebar } = useCart();
  const [añadido, setAñadido] = useState(false);
  const imagen = urlImagen(producto.imagen);
  const sinStock = producto.stock <= 0;
  // En la tienda se muestra siempre el precio con IVA incluido
  const precioConIva = Number(producto.precio) * (1 + (Number(producto.iva) || 0) / 100);

  function añadir() {
    addItem(producto, 1);
    setAñadido(true);
    setTimeout(() => setAñadido(false), 1500);
    if (esEscritorio()) abrirSidebar();
  }

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
        <div className="d-flex align-items-center justify-content-between mt-2 gap-2">
          <span className="sc-precio">
            {fmtPrecio(precioConIva)} <small className="text-muted fw-normal">IVA incl.</small>
          </span>
          <div className="d-flex gap-2">
            <Button
              variant={añadido ? 'success' : 'caramelo'}
              size="sm"
              disabled={sinStock || añadido}
              onClick={añadir}
              title={sinStock ? 'Sin stock' : 'Añadir al carrito'}
            >
              {añadido ? <FaCheck /> : <FaCartPlus />}
            </Button>
            <Button as={Link} to={`/tienda/${producto.id_producto}`} variant="outline-marron" size="sm">
              Ver detalle
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
