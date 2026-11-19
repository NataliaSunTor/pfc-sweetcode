import { useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { post, put } from '../../api/client.js';
import { AlertaError } from '../Estado.jsx';

const VACIA = { nombre: '', descripcion: '' };

export default function ModalCategoria({ categoria, onCerrar, onGuardado }) {
  // categoria === null → modo alta; si tiene id_categoria → modo edición
  const esEdicion = Boolean(categoria?.id_categoria);
  const [form, setForm] = useState(VACIA);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm({
      nombre: categoria?.nombre ?? '',
      descripcion: categoria?.descripcion ?? '',
    });
    setError(null);
  }, [categoria]);

  function set(campo) {
    return (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  }

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      if (esEdicion) await put(`/api/categorias/${categoria.id_categoria}`, form);
      else await post('/api/categorias', form);
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
          <Modal.Title className="sc-titulo h5">
            {esEdicion ? `Editar categoría «${categoria.nombre}»` : 'Nueva categoría'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AlertaError error={error} />
          <Form.Group className="mb-3">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              value={form.nombre}
              onChange={set('nombre')}
              maxLength={45}
              placeholder="p. ej. bolleria"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              value={form.descripcion}
              onChange={set('descripcion')}
              maxLength={45}
              placeholder="p. ej. Bollería recién hecha"
              required
            />
          </Form.Group>
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
