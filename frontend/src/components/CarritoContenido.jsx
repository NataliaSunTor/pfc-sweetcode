import { useEffect, useState } from 'react';
import { Alert, Button, Form, InputGroup, ListGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import { get, post } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { urlImagen } from '../utils/imagen.js';
import { fmtPrecio } from '../utils/format.js';
import { Cargando, AlertaError } from './Estado.jsx';

// Lógica compartida del carrito: se pinta en el sidebar (desktop) y en la página /carrito (móvil)
export default function CarritoContenido({ alTerminar }) {
  const { lineas, quitarItem, setCantidad, limpiar, subtotal } = useCart();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [direcciones, setDirecciones] = useState([]);
  const [idDireccion, setIdDireccion] = useState('');
  const [cargandoDirecciones, setCargandoDirecciones] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [pedidoCreado, setPedidoCreado] = useState(null);

  useEffect(() => {
    if (!usuario) return;
    setCargandoDirecciones(true);
    get('/api/direcciones')
      .then((dirs) => {
        setDirecciones(dirs);
        const principal = dirs.find((d) => d.principal === 1) ?? dirs[0];
        if (principal) setIdDireccion(principal.id_direccion);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargandoDirecciones(false));
  }, [usuario]);

  if (lineas.length === 0 && !pedidoCreado) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">Tu carrito está vacío.</p>
        <Button as={Link} to="/tienda" variant="caramelo" onClick={alTerminar}>
          Ir a la tienda
        </Button>
      </div>
    );
  }

  if (pedidoCreado) {
    return (
      <Alert variant="success" className="my-3">
        <Alert.Heading>Pedido #{pedidoCreado.id_pedido} creado</Alert.Heading>
        <p className="mb-2">Importe total: {fmtPrecio(pedidoCreado.importe_total)}</p>
        <div className="d-flex gap-2">
          <Button as={Link} to="/cuenta" variant="outline-marron" size="sm" onClick={alTerminar}>
            Ver mis pedidos
          </Button>
          <Button as={Link} to="/tienda" variant="caramelo" size="sm" onClick={alTerminar}>
            Seguir comprando
          </Button>
        </div>
      </Alert>
    );
  }

  function finalizarCompra() {
    setError(null);
    if (!usuario) {
      navigate('/login', { state: { volver: '/carrito' } });
      return;
    }
    if (!idDireccion) {
      setError('Necesitas una dirección de entrega. Añádela en Mi cuenta.');
      return;
    }
    setEnviando(true);
    post('/api/pedidos', {
      id_direccion: Number(idDireccion),
      lineas: lineas.map((l) => ({ id_producto: l.id_producto, cantidad: l.cantidad })),
    })
      .then((pedido) => {
        setPedidoCreado(pedido);
        limpiar();
      })
      .catch((e) => setError(e.message))
      .finally(() => setEnviando(false));
  }

  return (
    <div>
      <ListGroup variant="flush" className="mb-3">
        {lineas.map((l) => (
          <ListGroup.Item key={l.id_producto} className="px-0">
            <div className="d-flex align-items-center gap-2">
              {urlImagen(l.imagen) ? (
                <img src={urlImagen(l.imagen)} alt={l.nombre} className="sc-miniatura" />
              ) : (
                <div className="sc-miniatura sc-tarjeta-sin-imagen" />
              )}
              <div className="flex-grow-1">
                <div className="fw-semibold">{l.nombre}</div>
                <small className="text-muted">{fmtPrecio(l.precio)} / unidad</small>
                <InputGroup size="sm" className="mt-1" style={{ maxWidth: 110 }}>
                  <InputGroup.Text onClick={() => setCantidad(l.id_producto, l.cantidad - 1)} role="button">
                    −
                  </InputGroup.Text>
                  <Form.Control
                    value={l.cantidad}
                    readOnly
                    className="text-center"
                    aria-label={`Cantidad de ${l.nombre}`}
                  />
                  <InputGroup.Text onClick={() => setCantidad(l.id_producto, l.cantidad + 1)} role="button">
                    +
                  </InputGroup.Text>
                </InputGroup>
              </div>
              <div className="text-end">
                <div className="fw-semibold">{fmtPrecio(l.precio * l.cantidad)}</div>
                <Button variant="link" size="sm" className="text-danger p-0" onClick={() => quitarItem(l.id_producto)}>
                  <FaTrash /> Quitar
                </Button>
              </div>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>

      <div className="d-flex justify-content-between fw-bold fs-5 mb-3">
        <span>Subtotal</span>
        <span className="sc-precio">{fmtPrecio(subtotal)}</span>
      </div>

      <AlertaError error={error} />

      {usuario && (
        <Form.Group className="mb-3">
          <Form.Label>Dirección de entrega</Form.Label>
          {cargandoDirecciones ? (
            <Cargando texto="Cargando direcciones…" />
          ) : direcciones.length === 0 ? (
            <Alert variant="warning" className="py-2 mb-0">
              No tienes direcciones. <Link to="/cuenta">Añade una en Mi cuenta</Link>.
            </Alert>
          ) : (
            <Form.Select value={idDireccion} onChange={(e) => setIdDireccion(e.target.value)}>
              {direcciones.map((d) => (
                <option key={d.id_direccion} value={d.id_direccion}>
                  {d.calle}, {d.ciudad} ({d.codigo_postal}){d.principal === 1 ? ' — principal' : ''}
                </option>
              ))}
            </Form.Select>
          )}
        </Form.Group>
      )}

      <Button variant="caramelo" className="w-100" disabled={enviando || (usuario && direcciones.length === 0)} onClick={finalizarCompra}>
        {enviando ? 'Enviando pedido…' : usuario ? 'Finalizar compra' : 'Entrar y finalizar compra'}
      </Button>
    </div>
  );
}
