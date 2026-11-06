import { useEffect, useState } from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import { get } from '../../api/client.js';
import { fmtPrecio } from '../../utils/format.js';
import { Cargando, AlertaError } from '../../components/Estado.jsx';

export default function AdminInicio() {
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([get('/api/pedidos'), get('/api/presupuestos')])
      .then(([pedidos, solicitudes]) => {
        const ventas = pedidos
          .filter((p) => p.estado !== 'cancelado')
          .reduce((acc, p) => acc + Number(p.importe_total), 0);
        setResumen({
          pedidosTotales: pedidos.length,
          pedidosPendientes: pedidos.filter((p) => p.estado === 'pendiente').length,
          ventas,
          presupuestosPendientes: solicitudes.filter((s) => s.estado === 'pendiente').length,
        });
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <AlertaError error={error} />;
  if (!resumen) return <Cargando texto="Cargando resumen…" />;

  const tarjetas = [
    { titulo: 'Pedidos totales', valor: resumen.pedidosTotales },
    { titulo: 'Pendientes de preparar', valor: resumen.pedidosPendientes },
    { titulo: 'Ventas (sin cancelados)', valor: fmtPrecio(resumen.ventas) },
    { titulo: 'Presupuestos pendientes', valor: resumen.presupuestosPendientes },
  ];

  return (
    <Row xs={1} sm={2} className="g-3">
      {tarjetas.map((t) => (
        <Col key={t.titulo}>
          <Card className="sc-tarjeta text-center">
            <Card.Body>
              <div className="sc-resumen-valor">{t.valor}</div>
              <div className="text-muted">{t.titulo}</div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
