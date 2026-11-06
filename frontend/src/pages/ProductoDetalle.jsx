import { useEffect, useState } from 'react';
import { Badge, Button, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { FaBirthdayCake, FaCheck } from 'react-icons/fa';
import { get } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { urlImagen } from '../utils/imagen.js';
import { fmtPrecio } from '../utils/format.js';
import { esEscritorio } from '../utils/escritorio.js';
import { Cargando, AlertaError } from '../components/Estado.jsx';

export default function ProductoDetalle() {
  const { id } = useParams();
  const { addItem, abrirSidebar } = useCart();

  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [añadido, setAñadido] = useState(false);

  useEffect(() => {
    setCargando(true);
    setError(null);
    get(`/api/productos/${id}`)
      .then(setProducto)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [id]);

  function añadir() {
    if (!producto) return;
    addItem(producto, cantidad);
    setAñadido(true);
    setTimeout(() => setAñadido(false), 1500);
    if (esEscritorio()) abrirSidebar();
  }

  if (cargando) return <Container className="py-5"><Cargando texto="Cargando producto…" /></Container>;
  if (error || !producto)
    return <Container className="py-5"><AlertaError error={error || 'Producto no encontrado'} /></Container>;

  const imagen = urlImagen(producto.imagen);
  const iva = Number(producto.iva) || 0;
  const precioBase = Number(producto.precio);
  const totalConIva = precioBase * (1 + iva / 100);
  const sinStock = producto.stock <= 0;

  return (
    <Container className="py-5">
      <Row className="g-4">
        <Col md={6}>
          {imagen ? (
            <img src={imagen} alt={producto.nombre} className="sc-detalle-img" />
          ) : (
            <div className="sc-detalle-img sc-tarjeta-sin-imagen">
              <FaBirthdayCake size={80} />
            </div>
          )}
        </Col>
        <Col md={6}>
          {producto.categoria && (
            <Badge bg="secondary" className="sc-badge-categoria mb-2">
              {producto.categoria.nombre}
            </Badge>
          )}
          <h1 className="sc-titulo">{producto.nombre}</h1>
          <p className="text-muted">{producto.descripcion}</p>

          <dl className="row mt-4">
            <dt className="col-4">Precio</dt>
            <dd className="col-8">{fmtPrecio(precioBase)}</dd>
            <dt className="col-4">IVA ({iva}%)</dt>
            <dd className="col-8">{fmtPrecio(precioBase * (iva / 100))}</dd>
            <dt className="col-4 fw-bold">Total con IVA</dt>
            <dd className="col-8 fw-bold sc-precio">{fmtPrecio(totalConIva)}</dd>
            <dt className="col-4">Stock</dt>
            <dd className="col-8">{sinStock ? <span className="text-danger">Sin stock</span> : producto.stock}</dd>
          </dl>

          <div className="sc-acciones-detalle d-flex align-items-center gap-3 mt-4">
            <InputGroup style={{ maxWidth: 130 }}>
              <InputGroup.Text role="button" onClick={() => setCantidad(Math.max(1, cantidad - 1))}>
                −
              </InputGroup.Text>
              <Form.Control
                value={cantidad}
                readOnly
                className="text-center"
                aria-label="Cantidad"
              />
              <InputGroup.Text
                role="button"
                onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
              >
                +
              </InputGroup.Text>
            </InputGroup>
            <Button variant="caramelo" size="lg" disabled={sinStock || añadido} onClick={añadir}>
              {añadido ? <><FaCheck /> Añadido</> : 'Añadir al carrito'}
            </Button>
          </div>
          <Button as={Link} to="/tienda" variant="link" className="mt-3 p-0">
            ← Seguir comprando
          </Button>
        </Col>
      </Row>
    </Container>
  );
}
