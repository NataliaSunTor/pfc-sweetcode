import { useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { get, post, postForm, put } from '../../api/client.js';
import { urlImagen } from '../../utils/imagen.js';
import { AlertaError } from '../Estado.jsx';

const VACIO = { nombre: '', descripcion: '', precio: '', iva: '10', stock: '0', id_categoria: '', activo: true };

// Modal de alta/edición de producto. Si se elige fichero, se sube antes con POST /api/upload
// y la { url } devuelta se guarda en el campo imagen.
export default function ModalProducto({ producto, onCerrar, onGuardado }) {
  const [form, setForm] = useState(VACIO);
  const [categorias, setCategorias] = useState([]);
  const [fichero, setFichero] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    get('/api/categorias').then(setCategorias).catch(() => {});
  }, []);

  useEffect(() => {
    if (producto) {
      setForm({
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        iva: producto.iva,
        stock: producto.stock,
        id_categoria: producto.id_categoria,
        activo: producto.activo === 1,
      });
    } else {
      setForm(VACIO);
    }
    setFichero(null);
    setError(null);
  }, [producto]);

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
      let imagen = producto?.imagen ?? null;
      if (fichero) {
        const fd = new FormData();
        fd.append('imagen', fichero);
        const { url } = await postForm('/api/upload', fd);
        imagen = url;
      }
      const body = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio: Number(form.precio),
        iva: Number(form.iva),
        stock: Number(form.stock),
        id_categoria: Number(form.id_categoria),
        activo: form.activo ? 1 : 0,
        imagen,
      };
      if (producto) await put(`/api/productos/${producto.id_producto}`, body);
      else await post('/api/productos', body);
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const imagenActual = urlImagen(producto?.imagen);

  return (
    <Modal show onHide={onCerrar} size="lg">
      <Form onSubmit={enviar}>
        <Modal.Header closeButton>
          <Modal.Title className="sc-titulo h5">{producto ? 'Editar producto' : 'Nuevo producto'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AlertaError error={error} />
          <Form.Group className="mb-3">
            <Form.Label>Nombre</Form.Label>
            <Form.Control value={form.nombre} onChange={set('nombre')} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Descripción</Form.Label>
            <Form.Control as="textarea" rows={2} value={form.descripcion} onChange={set('descripcion')} required />
          </Form.Group>
          <div className="row">
            <Form.Group className="mb-3 col-md-4">
              <Form.Label>Precio (€)</Form.Label>
              <Form.Control type="number" step="0.01" min="0" value={form.precio} onChange={set('precio')} required />
            </Form.Group>
            <Form.Group className="mb-3 col-md-4">
              <Form.Label>IVA (%)</Form.Label>
              <Form.Control type="number" step="0.01" min="0" value={form.iva} onChange={set('iva')} required />
            </Form.Group>
            <Form.Group className="mb-3 col-md-4">
              <Form.Label>Stock</Form.Label>
              <Form.Control type="number" min="0" value={form.stock} onChange={set('stock')} required />
            </Form.Group>
          </div>
          <Form.Group className="mb-3">
            <Form.Label>Categoría</Form.Label>
            <Form.Select value={form.id_categoria} onChange={set('id_categoria')} required>
              <option value="">Elige una categoría…</option>
              {categorias.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Imagen</Form.Label>
            {imagenActual && !fichero && (
              <div className="mb-2"><img src={imagenActual} alt={form.nombre} className="sc-miniatura" style={{ width: 80, height: 80 }} /></div>
            )}
            <Form.Control type="file" accept="image/*" onChange={(e) => setFichero(e.target.files?.[0] ?? null)} />
            <Form.Text>Máx. 5 MB. Si no eliges nada, se conserva la imagen actual.</Form.Text>
          </Form.Group>
          <Form.Check type="checkbox" label="Activo (visible en la tienda)" checked={form.activo} onChange={set('activo')} />
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
