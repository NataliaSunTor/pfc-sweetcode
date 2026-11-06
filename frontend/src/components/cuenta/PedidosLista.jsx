import { useEffect, useState } from 'react';
import { Badge, Table } from 'react-bootstrap';
import { get } from '../../api/client.js';
import { fmtFechaCorta, fmtPrecio } from '../../utils/format.js';
import { variantePedido } from '../../utils/estados.js';
import { Cargando, AlertaError } from '../Estado.jsx';

export default function PedidosLista() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    get('/api/pedidos')
      .then(setPedidos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <Cargando texto="Cargando tus pedidos…" />;
  if (error) return <AlertaError error={error} />;
  if (pedidos.length === 0) return <p className="text-muted">Todavía no has hecho ningún pedido.</p>;

  return (
    <Table responsive hover size="sm">
      <thead>
        <tr>
          <th>Pedido</th>
          <th>Fecha</th>
          <th>Productos</th>
          <th>Estado</th>
          <th className="text-end">Importe</th>
        </tr>
      </thead>
      <tbody>
        {pedidos.map((p) => (
          <tr key={p.id_pedido}>
            <td>#{p.id_pedido}</td>
            <td>{fmtFechaCorta(p.fecha)}</td>
            <td>
              {(p.lineas_pedido ?? []).map((l) => `${l.producto?.nombre ?? `Producto ${l.id_producto}`} × ${l.cantidad}`).join(', ')}
            </td>
            <td><Badge bg={variantePedido(p.estado)}>{p.estado}</Badge></td>
            <td className="text-end fw-semibold">{fmtPrecio(p.importe_total)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
