import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import Chart from 'chart.js/auto';
import { get } from '../../api/client.js';
import { fmtPrecio } from '../../utils/format.js';
import { AlertaError, Cargando } from '../Estado.jsx';

// Colores del tema (index.css)
const CARAMELO = '#b9794e';
const CARAMELO_OSCURO = '#9d5f3a';
const MARRON_CLARO = '#8a6d5b';

// Día en hora local (evita que toISOString() mueva la fecha a UTC y cambie el día)
function diaLocal(fecha) {
  const d = new Date(fecha);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dia}`;
}

// Envoltorio reutilizable: crea el gráfico y lo destruye al desmontar/actualizar
function Grafico({ type, data, options, altura = 280 }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    chartRef.current = new Chart(canvasRef.current, { type, data, options });
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [type, data, options]);

  return (
    <div style={{ height: altura }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default function PanelVentas() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    get('/api/pedidos')
      .then((pedidos) => {
        // Los pedidos cancelados no cuentan como venta
        const validos = pedidos.filter((p) => p.estado !== 'cancelado');

        const porProducto = new Map(); // nombre → { unidades, importe }
        const porDia = new Map(); // 'YYYY-MM-DD' → { importe, pedidos }

        for (const p of validos) {
          const dia = diaLocal(p.fecha);
          const auxDia = porDia.get(dia) ?? { importe: 0, pedidos: 0 };
          auxDia.importe += Number(p.importe_total);
          auxDia.pedidos += 1;
          porDia.set(dia, auxDia);

          for (const l of p.lineas_pedido ?? []) {
            const nombre = l.producto?.nombre ?? `Producto #${l.id_producto}`;
            const aux = porProducto.get(nombre) ?? { unidades: 0, importe: 0 };
            aux.unidades += Number(l.cantidad);
            aux.importe += Number(l.subtotal);
            porProducto.set(nombre, aux);
          }
        }

        const productos = [...porProducto.entries()]
          .map(([nombre, v]) => ({ nombre, ...v }))
          .sort((a, b) => b.unidades - a.unidades); // más vendidos primero

        const dias = [...porDia.entries()]
          .map(([dia, v]) => ({ dia, ...v }))
          .sort((a, b) => a.dia.localeCompare(b.dia)); // orden cronológico

        setDatos({ productos, dias, totalPedidos: validos.length });
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  // Config de Chart.js memoizada para no recrear los gráficos en cada render
  const chartProductos = useMemo(() => {
    if (!datos) return null;
    return {
      type: 'bar',
      data: {
        labels: datos.productos.map((p) => p.nombre),
        datasets: [{
          label: 'Unidades vendidas',
          data: datos.productos.map((p) => p.unidades),
          backgroundColor: CARAMELO,
          borderRadius: 4,
        }],
      },
      options: {
        indexAxis: 'y', // barras horizontales: se leen mejor los nombres largos
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const p = datos.productos[ctx.dataIndex];
                return ` ${p.unidades} uds · ${fmtPrecio(p.importe)}`;
              },
            },
          },
        },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    };
  }, [datos]);

  const chartDias = useMemo(() => {
    if (!datos) return null;
    return {
      type: 'line',
      data: {
        labels: datos.dias.map((d) => d.dia),
        datasets: [
          {
            label: 'Ventas (€)',
            data: datos.dias.map((d) => Number(d.importe.toFixed(2))),
            borderColor: CARAMELO_OSCURO,
            backgroundColor: CARAMELO,
            tension: 0.25,
            fill: true,
            yAxisID: 'y',
          },
          {
            label: 'Nº pedidos',
            data: datos.dias.map((d) => d.pedidos),
            borderColor: MARRON_CLARO,
            borderDash: [5, 4],
            tension: 0.25,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.dataset.label.startsWith('Ventas')
                ? ` ${fmtPrecio(ctx.parsed.y)}`
                : ` ${ctx.parsed.y} pedidos`,
            },
          },
        },
        scales: {
          y: { beginAtZero: true, position: 'left', title: { display: true, text: '€' } },
          y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { precision: 0 }, title: { display: true, text: 'pedidos' } },
        },
      },
    };
  }, [datos]);

  if (cargando) return <Cargando texto="Calculando ventas…" />;
  if (error) return <AlertaError error={error} />;
  if (!datos || datos.totalPedidos === 0) {
    return <p className="text-muted">Todavía no hay ventas (pedidos no cancelados) para graficar.</p>;
  }

  return (
    <div>
      <h2 className="h5 sc-titulo mb-3">Ventas</h2>
      <Row className="g-3">
        <Col lg={6}>
          <Card className="sc-tarjeta h-100">
            <Card.Body>
              <Card.Title className="h6 sc-titulo">Productos más y menos vendidos</Card.Title>
              <Grafico {...chartProductos} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="sc-tarjeta h-100">
            <Card.Body>
              <Card.Title className="h6 sc-titulo">Ventas por día</Card.Title>
              <Grafico {...chartDias} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
