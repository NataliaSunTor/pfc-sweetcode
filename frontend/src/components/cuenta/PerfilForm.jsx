import { useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { put } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { AlertaError } from '../Estado.jsx';

export default function PerfilForm() {
  const { usuario, actualizarUsuario } = useAuth();
  const [form, setForm] = useState({
    nombre: usuario.nombre ?? '',
    apellidos: usuario.apellidos ?? '',
    telefono: usuario.telefono ?? '',
    email: usuario.email ?? '',
    password: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);

  function set(campo) {
    return (e) => {
      setForm((f) => ({ ...f, [campo]: e.target.value }));
      setOk(false);
    };
  }

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setEnviando(true);
    try {
      const body = {
        nombre: form.nombre,
        apellidos: form.apellidos,
        telefono: form.telefono,
        email: form.email,
      };
      if (form.password) body.password = form.password;
      const res = await put('/api/auth/perfil', body);
      actualizarUsuario(res.usuario);
      setForm((f) => ({ ...f, password: '' }));
      setOk(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Form onSubmit={enviar} style={{ maxWidth: 520 }}>
      <AlertaError error={error} />
      {ok && <Alert variant="success">Perfil actualizado.</Alert>}
      <Form.Group className="mb-3">
        <Form.Label>Nombre</Form.Label>
        <Form.Control value={form.nombre} onChange={set('nombre')} required />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Apellidos</Form.Label>
        <Form.Control value={form.apellidos} onChange={set('apellidos')} required />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Teléfono</Form.Label>
        <Form.Control value={form.telefono} onChange={set('telefono')} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Email</Form.Label>
        <Form.Control type="email" value={form.email} onChange={set('email')} required />
      </Form.Group>
      <Form.Group className="mb-4">
        <Form.Label>Nueva contraseña (déjala en blanco para no cambiarla)</Form.Label>
        <Form.Control type="password" value={form.password} onChange={set('password')} minLength={6} autoComplete="new-password" />
      </Form.Group>
      <Button type="submit" variant="caramelo" disabled={enviando}>
        {enviando ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </Form>
  );
}
