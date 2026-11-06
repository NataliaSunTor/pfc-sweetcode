import { useState } from 'react';
import { Button, Card, Container, Form } from 'react-bootstrap';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AlertaError } from '../components/Estado.jsx';

export default function Login() {
  const { usuario, entrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const volver = location.state?.volver || '/cuenta';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  if (usuario) return <Navigate to={volver} replace />;

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await entrar(email, password);
      navigate(volver, { replace: true });
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
          <h1 className="sc-titulo h3 text-center mb-4">Entrar</h1>
          <AlertaError error={error} />
          <Form onSubmit={enviar}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Form.Group>
            <Button type="submit" variant="caramelo" className="w-100" disabled={enviando}>
              {enviando ? 'Entrando…' : 'Entrar'}
            </Button>
          </Form>
          <p className="text-center mt-3 mb-0">
            ¿No tienes cuenta? <Link to="/registro">Crear una</Link>
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}
