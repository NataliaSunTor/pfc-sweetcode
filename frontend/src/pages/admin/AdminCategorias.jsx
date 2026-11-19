import { useEffect, useState } from 'react';
import { Button, Table } from 'react-bootstrap';
import { del, get } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { AlertaError, Cargando } from '../../components/Estado.jsx';
import ModalCategoria from '../../components/admin/ModalCategoria.jsx';

export default function AdminCategorias() {
  const { rol } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // null | { categoria: null } (alta) | { categoria } (editar)

  function cargar() {
    setCargando(true);
    get('/api/categorias')
      .then(setCategorias)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function eliminar(c) {
    if (!window.confirm(`¿Eliminar la categoría «${c.nombre}»?`)) return;
    setError(null);
    try {
      await del(`/api/categorias/${c.id_categoria}`);
      cargar();
    } catch (err) {
      setError(err.message); // p. ej. 409 si tiene productos o artículos asociados
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 sc-titulo mb-0">Categorías</h2>
        <Button variant="caramelo" size="sm" onClick={() => setModal({ categoria: null })}>Nueva categoría</Button>
      </div>
      <AlertaError error={error} />
      {cargando ? <Cargando texto="Cargando categorías…" /> : categorias.length === 0 ? (
        <p className="text-muted">No hay categorías todavía.</p>
      ) : (
        <Table responsive hover size="sm" className="align-middle">
          <thead>
            <tr>
              <th>#</th><th>Nombre</th><th>Descripción</th><th></th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((c) => (
              <tr key={c.id_categoria}>
                <td>{c.id_categoria}</td>
                <td>{c.nombre}</td>
                <td>{c.descripcion}</td>
                <td className="text-end text-nowrap">
                  <Button variant="outline-marron" size="sm" className="me-1" onClick={() => setModal({ categoria: c })}>Editar</Button>
                  {rol === 'admin' && (
                    <Button variant="outline-danger" size="sm" onClick={() => eliminar(c)}>Eliminar</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {modal && (
        <ModalCategoria
          categoria={modal.categoria}
          onCerrar={() => setModal(null)}
          onGuardado={() => { setModal(null); cargar(); }}
        />
      )}
    </div>
  );
}
