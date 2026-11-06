import { useEffect, useState } from 'react';
import { Badge, Button, Form, Modal, Table } from 'react-bootstrap';
import { get, put } from '../../api/client.js';
import { fmtFechaCorta, fmtPrecio } from '../../utils/format.js';
import { variantePresupuesto } from '../../utils/estados.js';
import { AlertaError, Cargando } from '../../components/Estado.jsx';

const ESTADOS = ['pendiente', 'presupuestado', 'aceptado', 'rechazado'];

export default function AdminPresupuestos() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // solicitud a presupuestar
  const [precio, setPrecio] = useState('');
  const [enviando, setEnviando] = useState(false);

  function cargar() {
    setCargando(true);
    get('/api/presupuestos')
      .then(setSolicitudes)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function enviarPrecio(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await put(`/api/presupuestos/${modal.id_presupuesto}/respuesta`, { precio_estimado: Number(precio) });
      setModal(null);
      setPrecio('');
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function cambiarEstado(s, estado) {
    setError(null);
    try {
      await put(`/api/presupuestos/${s.id_presupuesto}/estado`, { estado });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2 className="h5 sc-titulo mb-3">Presupuestos</h2>
      <AlertaError error={error} />
      {cargando ? <Cargando texto="Cargando solicitudes…" /> : solicitudes.length === 0 ? (
        <p className="text-muted">No hay solicitudes de presupuesto.</p>
      ) : (
        <Table responsive hover size="sm" className="align-middle">
          <thead>
            <tr>
              <th>#</th><th>Fecha</th><th>Cliente</th><th>Evento</th><th>Descripción</th>
              <th>Entrega</th><th className="text-end">Precio est.</th><th>Estado</th><th></th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((s) => (
              <tr key={s.id_presupuesto}>
                <td>{s.id_presupuesto}</td>
                <td>{fmtFechaCorta(s.fecha)}</td>
                <td>{s.usuario ? `${s.usuario.nombre} ${s.usuario.apellidos}` : s.id_usuario}</td>
                <td>{s.tipo_evento}</td>
                <td style={{ maxWidth: 220 }}>{s.descripcion}</td>
                <td>{fmtFechaCorta(s.fecha_entrega)}</td>
                <td className="text-end">{s.precio_estimado != null ? fmtPrecio(s.precio_estimado) : '—'}</td>
                <td>
                  <Badge bg={variantePresupuesto(s.estado)} className="me-2">{s.estado}</Badge>
                  <Form.Select
                    size="sm"
                    value={s.estado}
                    onChange={(e) => cambiarEstado(s, e.target.value)}
                    style={{ display: 'inline-block', width: 'auto' }}
                    aria-label="Cambiar estado"
                  >
                    {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </Form.Select>
                </td>
                <td className="text-end">
                  {s.estado === 'pendiente' && (
                    <Button variant="caramelo" size="sm" onClick={() => { setModal(s); setPrecio(''); setError(null); }}>
                      Presupuestar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={Boolean(modal)} onHide={() => setModal(null)}>
        <Form onSubmit={enviarPrecio}>
          <Modal.Header closeButton>
            <Modal.Title className="sc-titulo h5">Presupuestar solicitud #{modal?.id_presupuesto}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <AlertaError error={error} />
            {modal && <p className="text-muted">{modal.tipo_evento} — {modal.descripcion}</p>}
            <Form.Group>
              <Form.Label>Precio estimado (€)</Form.Label>
              <Form.Control type="number" step="0.01" min="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} required />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-marron" onClick={() => setModal(null)}>Cancelar</Button>
            <Button type="submit" variant="caramelo" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar presupuesto'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
