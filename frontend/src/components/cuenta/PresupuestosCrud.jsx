import { useEffect, useState } from 'react';
import { Badge, Button, Form, Table } from 'react-bootstrap';
import { get, post, put } from '../../api/client.js';
import { fmtFechaCorta, fmtPrecio } from '../../utils/format.js';
import { variantePresupuesto } from '../../utils/estados.js';
import { AlertaError, Cargando } from '../Estado.jsx';

export default function PresupuestosCrud() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ tipo_evento: '', descripcion: '', fecha_entrega: '' });
  const [enviando, setEnviando] = useState(false);

  function cargar() {
    get('/api/presupuestos')
      .then(setSolicitudes)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    setCargando(true);
    cargar();
  }, []);

  function set(campo) {
    return (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  }

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await post('/api/presupuestos', {
        tipo_evento: form.tipo_evento,
        descripcion: form.descripcion,
        fecha_entrega: new Date(form.fecha_entrega).toISOString(),
      });
      setForm({ tipo_evento: '', descripcion: '', fecha_entrega: '' });
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function responder(id, estado) {
    setError(null);
    try {
      await put(`/api/presupuestos/${id}/estado`, { estado });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2 className="h5 sc-titulo mb-3">Solicitar presupuesto</h2>
      <Form onSubmit={enviar} className="mb-4" style={{ maxWidth: 620 }}>
        <Form.Group className="mb-3">
          <Form.Label>Tipo de evento</Form.Label>
          <Form.Control value={form.tipo_evento} onChange={set('tipo_evento')} placeholder="boda, cumpleaños, empresa…" required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Descripción</Form.Label>
          <Form.Control as="textarea" rows={2} value={form.descripcion} onChange={set('descripcion')} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Fecha de entrega</Form.Label>
          <Form.Control type="date" value={form.fecha_entrega} onChange={set('fecha_entrega')} required />
        </Form.Group>
        <Button type="submit" variant="caramelo" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar solicitud'}
        </Button>
      </Form>

      <AlertaError error={error} />
      <h2 className="h5 sc-titulo mb-3">Mis solicitudes</h2>
      {cargando ? <Cargando texto="Cargando solicitudes…" /> : solicitudes.length === 0 ? (
        <p className="text-muted">No has solicitado ningún presupuesto.</p>
      ) : (
        <Table responsive hover size="sm">
          <thead>
            <tr>
              <th>Fecha</th><th>Evento</th><th>Entrega</th><th>Estado</th><th className="text-end">Precio est.</th><th></th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((s) => (
              <tr key={s.id_presupuesto}>
                <td>{fmtFechaCorta(s.fecha)}</td>
                <td>{s.tipo_evento}</td>
                <td>{fmtFechaCorta(s.fecha_entrega)}</td>
                <td><Badge bg={variantePresupuesto(s.estado)}>{s.estado}</Badge></td>
                <td className="text-end">{s.precio_estimado != null ? fmtPrecio(s.precio_estimado) : '—'}</td>
                <td className="text-end">
                  {s.estado === 'presupuestado' && (
                    <>
                      <Button variant="outline-success" size="sm" className="me-2" onClick={() => responder(s.id_presupuesto, 'aceptado')}>Aceptar</Button>
                      <Button variant="outline-danger" size="sm" onClick={() => responder(s.id_presupuesto, 'rechazado')}>Rechazar</Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
