import { useEffect, useState } from 'react';
import { Badge, Button, Form, InputGroup, Table } from 'react-bootstrap';
import { del, get, put } from '../../api/client.js';
import { AlertaError, Cargando } from '../../components/Estado.jsx';
import ModalUsuario from '../../components/admin/ModalUsuario.jsx';

export default function AdminUsuarios() {
  // La tabla solo muestra staff (admin y pastelero); los clientes solo salen en el buscador
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState(null); // null = aún no se ha buscado
  const [buscando, setBuscando] = useState(false);

  function cargar() {
    setCargando(true);
    get('/api/usuarios?roles=admin,pastelero')
      .then(setUsuarios)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function buscar(e) {
    e.preventDefault();
    const email = busqueda.trim();
    if (!email) return;
    setBuscando(true);
    setError(null);
    try {
      const res = await get(`/api/usuarios?email=${encodeURIComponent(email)}`);
      setResultados(res);
    } catch (err) {
      setError(err.message);
      setResultados(null);
    } finally {
      setBuscando(false);
    }
  }

  async function promover(u) {
    if (!window.confirm(`¿Convertir a ${u.nombre} ${u.apellidos} (${u.email}) en pastelero?`)) return;
    setError(null);
    try {
      await put(`/api/usuarios/${u.id_usuario}`, { rol: 'pastelero' });
      setResultados(null);
      setBusqueda('');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

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
      <h2 className="h5 sc-titulo mb-3">Usuarios (staff)</h2>

      <Form onSubmit={buscar} className="mb-3">
        <InputGroup>
          <Form.Control
            type="email"
            placeholder="Buscar por email para localizar un cliente…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <Button type="submit" variant="caramelo" disabled={buscando || !busqueda.trim()}>
            {buscando ? 'Buscando…' : 'Buscar'}
          </Button>
        </InputGroup>
        <Form.Text className="text-muted">
          La tabla solo muestra admin y pastelero. Busca un cliente por su email para convertirlo en pastelero.
        </Form.Text>
      </Form>

      <AlertaError error={error} />

      {resultados && (
        <div className="mb-4">
          <h3 className="h6 sc-titulo">Resultados de «{busqueda}»</h3>
          {resultados.length === 0 ? (
            <p className="text-muted mb-0">Ningún usuario con ese email.</p>
          ) : (
            <Table responsive hover size="sm" className="align-middle mb-0">
              <thead>
                <tr><th>#</th><th>Nombre</th><th>Email</th><th>Rol</th><th></th></tr>
              </thead>
              <tbody>
                {resultados.map((u) => (
                  <tr key={u.id_usuario}>
                    <td>{u.id_usuario}</td>
                    <td>{u.nombre} {u.apellidos}</td>
                    <td>{u.email}</td>
                    <td><Badge bg={u.rol === 'admin' ? 'danger' : u.rol === 'pastelero' ? 'info' : 'secondary'}>{u.rol}</Badge></td>
                    <td className="text-end">
                      {u.rol === 'cliente' && u.activo === 1 && (
                        <Button variant="outline-success" size="sm" onClick={() => promover(u)}>
                          Hacer pastelero
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      )}

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
                <td><Badge bg={u.rol === 'admin' ? 'danger' : 'info'}>{u.rol}</Badge></td>
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
