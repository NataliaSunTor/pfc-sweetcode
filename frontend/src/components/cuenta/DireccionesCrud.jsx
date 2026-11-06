import { useEffect, useState } from 'react';
import { Badge, Button, Form, Modal, Table } from 'react-bootstrap';
import { del, get, post, put } from '../../api/client.js';
import { AlertaError, Cargando } from '../Estado.jsx';

const VACIA = { calle: '', ciudad: '', codigo_postal: '', pais: 'España', principal: false };

export default function DireccionesCrud() {
  const [direcciones, setDirecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // null | { modo: 'alta' } | { modo: 'editar', direccion }
  const [form, setForm] = useState(VACIA);
  const [enviando, setEnviando] = useState(false);

  function cargar() {
    setCargando(true);
    get('/api/direcciones')
      .then(setDirecciones)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  function abrirAlta() {
    setForm(VACIA);
    setModal({ modo: 'alta' });
    setError(null);
  }

  function abrirEdicion(d) {
    setForm({
      calle: d.calle,
      ciudad: d.ciudad,
      codigo_postal: d.codigo_postal,
      pais: d.pais,
      principal: d.principal === 1,
    });
    setModal({ modo: 'editar', direccion: d });
    setError(null);
  }

  function set(campo) {
    return (e) => {
      const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [campo]: valor }));
    };
  }

  async function guardar(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const body = { ...form, principal: form.principal ? 1 : 0 };
      if (modal.modo === 'alta') await post('/api/direcciones', body);
      else await put(`/api/direcciones/${modal.direccion.id_direccion}`, body);
      setModal(null);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function eliminar(d) {
    if (!window.confirm(`¿Eliminar la dirección ${d.calle}?`)) return;
    setError(null);
    try {
      await del(`/api/direcciones/${d.id_direccion}`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 sc-titulo mb-0">Mis direcciones</h2>
        <Button variant="caramelo" size="sm" onClick={abrirAlta}>Añadir dirección</Button>
      </div>
      <AlertaError error={error} />
      {cargando ? <Cargando texto="Cargando direcciones…" /> : direcciones.length === 0 ? (
        <p className="text-muted">No tienes ninguna dirección guardada.</p>
      ) : (
        <Table responsive hover size="sm">
          <thead>
            <tr><th>Dirección</th><th>Ciudad</th><th>CP</th><th>País</th><th></th></tr>
          </thead>
          <tbody>
            {direcciones.map((d) => (
              <tr key={d.id_direccion}>
                <td>
                  {d.calle} {d.principal === 1 && <Badge bg="success" className="ms-1">principal</Badge>}
                </td>
                <td>{d.ciudad}</td>
                <td>{d.codigo_postal}</td>
                <td>{d.pais}</td>
                <td className="text-end">
                  <Button variant="outline-marron" size="sm" className="me-2" onClick={() => abrirEdicion(d)}>Editar</Button>
                  <Button variant="outline-danger" size="sm" onClick={() => eliminar(d)}>Eliminar</Button>
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
              {modal?.modo === 'alta' ? 'Nueva dirección' : 'Editar dirección'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <AlertaError error={error} />
            <Form.Group className="mb-3">
              <Form.Label>Calle y número</Form.Label>
              <Form.Control value={form.calle} onChange={set('calle')} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ciudad</Form.Label>
              <Form.Control value={form.ciudad} onChange={set('ciudad')} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Código postal</Form.Label>
              <Form.Control value={form.codigo_postal} onChange={set('codigo_postal')} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>País</Form.Label>
              <Form.Control value={form.pais} onChange={set('pais')} required />
            </Form.Group>
            <Form.Check
              type="checkbox"
              label="Dirección principal"
              checked={form.principal}
              onChange={set('principal')}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-marron" onClick={() => setModal(null)}>Cancelar</Button>
            <Button type="submit" variant="caramelo" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
