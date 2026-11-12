import { useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { get, post, put } from '../../api/client.js';
import { AlertaError } from '../Estado.jsx';

const VACIO = { titulo: '', contenido: '', etiquetas: '', id_categoria: '', publicado: false };

// Modal de alta/edición de entrada de blog. usa POST/PUT /api/articulos
export default function ModalArticulo({ articulo, onCerrar, onGuardado }) {
  const [form, setForm] = useState(VACIO);
  const [categorias, setCategorias] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    get('/api/categorias').then(setCategorias).catch(() => {});
  }, []);

  useEffect(() => {
    if (articulo) {
      setForm({
        titulo: articulo.titulo,
        contenido: articulo.contenido,
        etiquetas: articulo.etiquetas,
        id_categoria: articulo.id_categoria,
        publicado: articulo.publicado === 1,
      });
    } else {
      setForm(VACIO);
    }
    setError(null);
  }, [articulo]);

  function set(campo) {
    return (e) => {
      const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [campo]: valor }));
    };
  }

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const body = {
        titulo: form.titulo,
        contenido: form.contenido,
        etiquetas: form.etiquetas,
        id_categoria: Number(form.id_categoria),
        publicado: form.publicado ? 1 : 0,
      };
      if (articulo) await put(`/api/articulos/${articulo.id_articulos}`, body);
      else await post('/api/articulos', body);
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal show onHide={onCerrar} size="lg">
      <Form onSubmit={enviar}>
        <Modal.Header closeButton>
          <Modal.Title className="sc-titulo h5">{articulo ? 'Editar entrada' : 'Nueva entrada'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AlertaError error={error} />
          <Form.Group className="mb-3">
            <Form.Label>Título</Form.Label>
            <Form.Control value={form.titulo} onChange={set('titulo')} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Contenido</Form.Label>
            <Form.Control as="textarea" rows={6} value={form.contenido} onChange={set('contenido')} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Etiquetas (separadas por comas)</Form.Label>
            <Form.Control value={form.etiquetas} onChange={set('etiquetas')} placeholder="consejos,tartas" required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Categoría</Form.Label>
            <Form.Select value={form.id_categoria} onChange={set('id_categoria')} required>
              <option value="">Elige una categoría…</option>
              {categorias.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Check
            type="checkbox"
            label="Publicado (visible en el blog)"
            checked={form.publicado}
            onChange={set('publicado')}
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