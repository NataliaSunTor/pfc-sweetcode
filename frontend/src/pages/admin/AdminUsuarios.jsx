import { useEffect, useState } from 'react';
import { Badge, Button, Table } from 'react-bootstrap';
import { del, get } from '../../api/client.js';
import { AlertaError, Cargando } from '../../components/Estado.jsx';
import ModalUsuario from '../../components/admin/ModalUsuario.jsx';

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);

  function cargar() {
    setCargando(true);
    get('/api/usuarios')
      .then(setUsuarios)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function baja(u) {
    if (!window.confirm(`¿Dar de baja a ${u.nombre} ${u.apellidos}?`)) return;
    setError(null);
    try {
      await del(`/api/usuarios/${u.id_usuario}`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2 className="h5 sc-titulo mb-3">Usuarios</h2>
      <AlertaError error={error} />
      {cargando ? <Cargando texto="Cargando usuarios…" /> : (
        <Table responsive hover size="sm" className="align-middle">
          <thead>
            <tr>
              <th>#</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Rol</th><th>Estado</th><th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id_usuario} className={u.activo !== 1 ? 'table-secondary' : ''}>
                <td>{u.id_usuario}</td>
                <td>{u.nombre} {u.apellidos}</td>
                <td>{u.email}</td>
                <td>{u.telefono ?? '—'}</td>
                <td><Badge bg={u.rol === 'admin' ? 'danger' : u.rol === 'pastelero' ? 'info' : 'secondary'}>{u.rol}</Badge></td>
                <td>{u.activo === 1 ? <Badge bg="success">activo</Badge> : <Badge bg="danger">baja</Badge>}</td>
                <td className="text-end text-nowrap">
                  <Button variant="outline-marron" size="sm" className="me-1" onClick={() => setModal(u)}>Editar</Button>
                  <Button variant="outline-danger" size="sm" onClick={() => baja(u)}>Dar de baja</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {modal && (
        <ModalUsuario
          usuario={modal}
          onCerrar={() => setModal(null)}
          onGuardado={() => { setModal(null); cargar(); }}
        />
      )}
    </div>
  );
}
