import { useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { put } from '../../api/client.js';
import { AlertaError } from '../Estado.jsx';

export default function ModalUsuario({ usuario, onCerrar, onGuardado }) {
  const [form, setForm] = useState({ rol: 'cliente', telefono: '', activo: true });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm({
      rol: usuario.rol,
      telefono: usuario.telefono ?? '',
      activo: usuario.activo === 1,
    });
    setError(null);
  }, [usuario]);

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await put(`/api/usuarios/${usuario.id_usuario}`, {
        rol: form.rol,
        telefono: form.telefono,
        activo: form.activo ? 1 : 0,
      });
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal show onHide={onCerrar}>
      <Form onSubmit={enviar}>
        <Modal.Header closeButton>
          <Modal.Title className="sc-titulo h5">Editar {usuario.nombre} {usuario.apellidos}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AlertaError error={error} />
          <Form.Group className="mb-3">
            <Form.Label>Rol</Form.Label>
            <Form.Select value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}>
              <option value="cliente">cliente</option>
              <option value="pastelero">pastelero</option>
              <option value="admin">admin</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Teléfono</Form.Label>
            <Form.Control value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
          </Form.Group>
          <Form.Check
            type="checkbox"
            label="Activo"
            checked={form.activo}
            onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-marron" onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" variant="caramelo" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
