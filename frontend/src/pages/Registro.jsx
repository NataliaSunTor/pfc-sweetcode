import { useState } from 'react';
import { Button, Card, Container, Form } from 'react-bootstrap';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AlertaError } from '../components/Estado.jsx';

export default function Registro() {
  const { usuario, registrar } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nombre: '', apellidos: '', email: '', password: '', password2: '' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  if (usuario) return <Navigate to="/cuenta" replace />;

  function set(campo) {
    return (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  }

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.password2) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setEnviando(true);
    try {
      await registrar({
        nombre: form.nombre,
        apellidos: form.apellidos,
        email: form.email,
        password: form.password,
      });
      navigate('/cuenta', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Container className="sc-pagina-form py-5" style={{ maxWidth: 460 }}>
      <Card className="sc-tarjeta">
        <Card.Body className="p-4">
          <h1 className="sc-titulo h3 text-center mb-4">Crear cuenta</h1>
          <AlertaError error={error} />
          <Form onSubmit={enviar}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control value={form.nombre} onChange={set('nombre')} required autoComplete="given-name" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Apellidos</Form.Label>
              <Form.Control value={form.apellidos} onChange={set('apellidos')} required autoComplete="family-name" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control type="password" value={form.password} onChange={set('password')} required minLength={6} autoComplete="new-password" />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Repite la contraseña</Form.Label>
              <Form.Control type="password" value={form.password2} onChange={set('password2')} required minLength={6} autoComplete="new-password" />
            </Form.Group>
            <Button type="submit" variant="caramelo" className="w-100" disabled={enviando}>
              {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
          </Form>
          <p className="text-center mt-3 mb-0">
            ¿Ya tienes cuenta? <Link to="/login">Entrar</Link>
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}
