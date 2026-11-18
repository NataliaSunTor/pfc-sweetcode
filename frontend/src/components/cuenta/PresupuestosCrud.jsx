import { useEffect, useState } from 'react';
import { Badge, Button, Form, Modal, Table } from 'react-bootstrap';
import { del, get, post, put } from '../../api/client.js';
import { fmtFechaCorta, fmtPrecio } from '../../utils/format.js';
import { variantePresupuesto } from '../../utils/estados.js';
import { AlertaError, Cargando } from '../Estado.jsx';

const VACIA = { tipo_evento: '', descripcion: '', fecha_entrega: '' };
const VACIA_DIR = { calle: '', ciudad: '', codigo_postal: '', pais: 'España', principal: true };

function textoDireccion(d) {
  if (!d) return '—';
  return `${d.calle}, ${d.ciudad} ${d.codigo_postal}, ${d.pais}`;
}

function aFechaInput(fecha) {
  return fecha ? new Date(fecha).toISOString().slice(0, 10) : '';
}

export default function PresupuestosCrud() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // null | { modo: 'alta' } | { modo: 'editar', solicitud }
  const [form, setForm] = useState(VACIA);
  const [enviando, setEnviando] = useState(false);
  const [modalDir, setModalDir] = useState(false);
  const [formDir, setFormDir] = useState(VACIA_DIR);
  const [enviandoDir, setEnviandoDir] = useState(false);

  function cargar() {
    setCargando(true);
    Promise.all([get('/api/presupuestos?propios=1'), get('/api/direcciones')])
      .then(([sols, dirs]) => {
        setSolicitudes(sols);
        setDirecciones(dirs);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  // Mecanismo de direcciones: la entrega se hará en la dirección principal guardada
  const direccionPrincipal = direcciones.find((d) => d.principal === 1) || direcciones[0] || null;

  function abrirAlta() {
    setForm(VACIA);
    setModal({ modo: 'alta' });
    setError(null);
  }

  function abrirEdicion(s) {
    setForm({
      tipo_evento: s.tipo_evento,
      descripcion: s.descripcion,
      fecha_entrega: aFechaInput(s.fecha_entrega),
    });
    setModal({ modo: 'editar', solicitud: s });
    setError(null);
  }

  function set(campo) {
    return (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  }

  async function guardar(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const body = {
        tipo_evento: form.tipo_evento,
        descripcion: form.descripcion,
        fecha_entrega: new Date(form.fecha_entrega).toISOString(),
      };
      if (modal.modo === 'alta') await post('/api/presupuestos', body);
      else await put(`/api/presupuestos/${modal.solicitud.id_presupuesto}`, body);
      setModal(null);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function eliminar(s) {
    if (!window.confirm(`¿Eliminar la solicitud de «${s.tipo_evento}»?`)) return;
    setError(null);
    try {
      await del(`/api/presupuestos/${s.id_presupuesto}`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  function setDir(campo) {
    return (e) => {
      const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setFormDir((f) => ({ ...f, [campo]: valor }));
    };
  }

  // Guarda la dirección nueva en el mecanismo de direcciones y recarga todo
  async function guardarDireccion(e) {
    e.preventDefault();
    setEnviandoDir(true);
    setError(null);
    try {
      await post('/api/direcciones', { ...formDir, principal: formDir.principal ? 1 : 0 });
      setModalDir(false);
      setFormDir(VACIA_DIR);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviandoDir(false);
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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 sc-titulo mb-0">Mis presupuestos</h2>
        <Button variant="caramelo" size="sm" onClick={abrirAlta}>Solicitar presupuesto</Button>
      </div>
      <AlertaError error={error} />
      {cargando ? <Cargando texto="Cargando solicitudes…" /> : solicitudes.length === 0 ? (
        <p className="text-muted">No has solicitado ningún presupuesto.</p>
      ) : (
        <Table responsive hover size="sm" className="align-middle">
          <thead>
            <tr>
              <th>Fecha</th><th>Evento</th><th>Entrega</th><th>Dirección de entrega</th>
              <th>Estado</th><th className="text-end">Precio est.</th><th></th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((s) => (
              <tr key={s.id_presupuesto}>
                <td>{fmtFechaCorta(s.fecha)}</td>
                <td>{s.tipo_evento}</td>
                <td>{fmtFechaCorta(s.fecha_entrega)}</td>
                <td>
                  {textoDireccion(direccionPrincipal)}
                  {direccionPrincipal?.principal === 1 && <Badge bg="success" className="ms-1">principal</Badge>}
                </td>
                <td><Badge bg={variantePresupuesto(s.estado)}>{s.estado}</Badge></td>
                <td className="text-end">{s.precio_estimado != null ? fmtPrecio(s.precio_estimado) : '—'}</td>
                <td className="text-end">
                  {s.estado === 'pendiente' && (
                    <>
                      <Button variant="outline-marron" size="sm" className="me-2" onClick={() => abrirEdicion(s)}>Editar</Button>
                      <Button variant="outline-danger" size="sm" className="me-2" onClick={() => eliminar(s)}>Eliminar</Button>
                    </>
                  )}
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

      <Modal show={Boolean(modal)} onHide={() => setModal(null)}>
        <Form onSubmit={guardar}>
          <Modal.Header closeButton>
            <Modal.Title className="sc-titulo h5">
              {modal?.modo === 'alta' ? 'Solicitar presupuesto' : 'Editar solicitud'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <AlertaError error={error} />
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
            <Form.Group className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <Form.Label className="mb-0">Dirección de entrega</Form.Label>
                <Button variant="outline-marron" size="sm" onClick={() => { setFormDir(VACIA_DIR); setModalDir(true); }}>
                  Añadir dirección nueva
                </Button>
              </div>
              {direccionPrincipal ? (
                <>
                  <Form.Control plaintext readOnly defaultValue={textoDireccion(direccionPrincipal)} className="mt-2" />
                  <Form.Text className="text-muted">
                    Se usa tu dirección principal. Gestiona tus direcciones en la pestaña «Direcciones».
                  </Form.Text>
                </>
              ) : (
                <p className="text-muted small mt-2 mb-0">
                  No tienes direcciones guardadas. Añade una antes de aceptar el presupuesto.
                </p>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-marron" onClick={() => setModal(null)}>Cancelar</Button>
            <Button type="submit" variant="caramelo" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={modalDir} onHide={() => setModalDir(false)}>
        <Form onSubmit={guardarDireccion}>
          <Modal.Header closeButton>
            <Modal.Title className="sc-titulo h5">Nueva dirección</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Calle y número</Form.Label>
              <Form.Control value={formDir.calle} onChange={setDir('calle')} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ciudad</Form.Label>
              <Form.Control value={formDir.ciudad} onChange={setDir('ciudad')} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Código postal</Form.Label>
              <Form.Control value={formDir.codigo_postal} onChange={setDir('codigo_postal')} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>País</Form.Label>
              <Form.Control value={formDir.pais} onChange={setDir('pais')} required />
            </Form.Group>
            <Form.Check
              type="checkbox"
              label="Dirección principal (se usará para la entrega)"
              checked={formDir.principal}
              onChange={setDir('principal')}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-marron" onClick={() => setModalDir(false)}>Cancelar</Button>
            <Button type="submit" variant="caramelo" disabled={enviandoDir}>
              {enviandoDir ? 'Guardando…' : 'Guardar dirección'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
