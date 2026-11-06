import { useEffect, useState } from 'react';
import { Badge, Form, Table } from 'react-bootstrap';
import { get, put } from '../../api/client.js';
import { fmtFechaCorta, fmtPrecio } from '../../utils/format.js';
import { variantePedido } from '../../utils/estados.js';
import { AlertaError, Cargando } from '../../components/Estado.jsx';

const ESTADOS = ['pendiente', 'en_preparacion', 'enviado', 'entregado', 'cancelado'];

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  function cargar() {
    setCargando(true);
    get('/api/pedidos')
      .then(setPedidos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function cambiarEstado(p, estado) {
    setError(null);
    try {
      await put(`/api/pedidos/${p.id_pedido}/estado`, { estado });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2 className="h5 sc-titulo mb-3">Pedidos</h2>
      <AlertaError error={error} />
      {cargando ? <Cargando texto="Cargando pedidos…" /> : (
        <Table responsive hover size="sm" className="align-middle">
          <thead>
            <tr>
              <th>#</th><th>Fecha</th><th>Cliente</th><th>Productos</th>
              <th>Estado</th><th className="text-end">Importe</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id_pedido}>
                <td>{p.id_pedido}</td>
                <td>{fmtFechaCorta(p.fecha)}</td>
                <td>{p.usuario ? `${p.usuario.nombre} ${p.usuario.apellidos}` : p.id_usuario}</td>
                <td>
                  {(p.lineas_pedido ?? []).map((l) => `${l.producto?.nombre ?? l.id_producto} × ${l.cantidad}`).join(', ')}
                </td>
                <td>
                  <Badge bg={variantePedido(p.estado)} className="me-2">{p.estado}</Badge>
                  <Form.Select
                    size="sm"
                    value={p.estado}
                    onChange={(e) => cambiarEstado(p, e.target.value)}
                    style={{ display: 'inline-block', width: 'auto' }}
                    aria-label="Cambiar estado"
                  >
                    {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </Form.Select>
                </td>
                <td className="text-end fw-semibold">{fmtPrecio(p.importe_total)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
