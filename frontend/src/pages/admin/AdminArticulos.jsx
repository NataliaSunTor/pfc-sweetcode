import { useEffect, useState } from 'react';
import { Badge, Button, Table } from 'react-bootstrap';
import { del, get, put } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { AlertaError, Cargando } from '../../components/Estado.jsx';
import ModalArticulo from '../../components/admin/ModalArticulo.jsx';

export default function AdminArticulos() {
  const { rol } = useAuth();
  const [articulos, setArticulos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // null | articulo (editar) | {} (alta)

  function cargar() {
    setCargando(true);
    // con token de staff, la API devuelve también los borradores
    get('/api/articulos')
      .then(setArticulos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function togglePublicado(a) {
    setError(null);
    try {
      await put(`/api/articulos/${a.id_articulos}`, { publicado: a.publicado === 1 ? 0 : 1 });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminar(a) {
    if (!window.confirm(`¿Eliminar definitivamente "${a.titulo}"?`)) return;
    setError(null);
    try {
      await del(`/api/articulos/${a.id_articulos}`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 sc-titulo mb-0">Blog</h2>
        <Button variant="caramelo" size="sm" onClick={() => setModal({})}>Nueva entrada</Button>
      </div>
      <AlertaError error={error} />
      {cargando ? <Cargando texto="Cargando entradas…" /> : (
        <Table responsive hover size="sm" className="align-middle">
          <thead>
            <tr>
              <th>Título</th><th>Categoría</th><th>Etiquetas</th><th>Fecha</th><th>Estado</th><th></th>
            </tr>
          </thead>
          <tbody>
            {articulos.map((a) => (
              <tr key={a.id_articulos} className={a.publicado !== 1 ? 'table-secondary' : ''}>
                <td>{a.titulo}</td>
                <td>{a.categoria?.nombre}</td>
                <td>{a.etiquetas}</td>
                <td>{a.fecha ? new Date(a.fecha).toLocaleDateString('es-ES') : ''}</td>
                <td>
                  {a.publicado === 1
                    ? <Badge bg="success">publicado</Badge>
                    : <Badge bg="warning" text="dark">borrador</Badge>}
                </td>
                <td className="text-end text-nowrap">
                  <Button variant="outline-marron" size="sm" className="me-1" onClick={() => setModal(a)}>Editar</Button>
                  <Button
                    variant={a.publicado === 1 ? 'outline-warning' : 'outline-success'}
                    size="sm"
                    className="me-1"
                    onClick={() => togglePublicado(a)}
                  >
                    {a.publicado === 1 ? 'Despublicar' : 'Publicar'}
                  </Button>
                  {rol === 'admin' && (
                    <Button variant="outline-danger" size="sm" onClick={() => eliminar(a)}>Eliminar</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {modal !== null && (
        <ModalArticulo
          articulo={modal.id_articulos ? modal : null}
          onCerrar={() => setModal(null)}
          onGuardado={() => { setModal(null); cargar(); }}
        />
      )}
    </div>
  );
}