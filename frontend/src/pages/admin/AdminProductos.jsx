import { useEffect, useState } from 'react';
import { Badge, Button, Table } from 'react-bootstrap';
import { del, get, put } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { fmtPrecio } from '../../utils/format.js';
import { urlImagen } from '../../utils/imagen.js';
import { AlertaError, Cargando } from '../../components/Estado.jsx';
import ModalProducto from '../../components/admin/ModalProducto.jsx';

export default function AdminProductos() {
  const { rol } = useAuth();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // null | producto (editar) | {} (alta)

  function cargar() {
    setCargando(true);
    get('/api/productos/todos')
      .then(setProductos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function toggleActivo(p) {
    setError(null);
    try {
      await put(`/api/productos/${p.id_producto}`, { activo: p.activo === 1 ? 0 : 1 });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminar(p) {
    if (!window.confirm(`¿Eliminar definitivamente "${p.nombre}"?`)) return;
    setError(null);
    try {
      await del(`/api/productos/${p.id_producto}`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 sc-titulo mb-0">Productos</h2>
        <Button variant="caramelo" size="sm" onClick={() => setModal({})}>Nuevo producto</Button>
      </div>
      <AlertaError error={error} />
      {cargando ? <Cargando texto="Cargando productos…" /> : (
        <Table responsive hover size="sm" className="align-middle">
          <thead>
            <tr>
              <th></th><th>Nombre</th><th>Categoría</th><th className="text-end">Precio</th>
              <th className="text-end">Stock</th><th>Estado</th><th></th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id_producto} className={p.activo !== 1 ? 'table-secondary' : ''}>
                <td>
                  {urlImagen(p.imagen)
                    ? <img src={urlImagen(p.imagen)} alt={p.nombre} className="sc-miniatura" />
                    : <div className="sc-miniatura sc-tarjeta-sin-imagen" />}
                </td>
                <td>{p.nombre}</td>
                <td>{p.categoria?.nombre}</td>
                <td className="text-end">{fmtPrecio(p.precio)}</td>
                <td className="text-end">{p.stock}</td>
                <td>
                  {p.activo === 1
                    ? <Badge bg="success">activo</Badge>
                    : <Badge bg="danger">baja</Badge>}
                </td>
                <td className="text-end text-nowrap">
                  <Button variant="outline-marron" size="sm" className="me-1" onClick={() => setModal(p)}>Editar</Button>
                  <Button
                    variant={p.activo === 1 ? 'outline-warning' : 'outline-success'}
                    size="sm"
                    className="me-1"
                    onClick={() => toggleActivo(p)}
                  >
                    {p.activo === 1 ? 'Dar de baja' : 'Reactivar'}
                  </Button>
                  {rol === 'admin' && (
                    <Button variant="outline-danger" size="sm" onClick={() => eliminar(p)}>Eliminar</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {modal !== null && (
        <ModalProducto
          producto={modal.id_producto ? modal : null}
          onCerrar={() => setModal(null)}
          onGuardado={() => { setModal(null); cargar(); }}
        />
      )}
    </div>
  );
}
