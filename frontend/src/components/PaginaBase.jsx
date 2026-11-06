import { Container } from 'react-bootstrap';

// Página placeholder mientras se desarrolla cada fase: título + aviso visible.
export default function PaginaBase({ titulo, children }) {
  return (
    <Container className="py-5">
      <h1 className="sc-titulo mb-4">{titulo}</h1>
      {children ?? <p className="text-muted">Página en construcción.</p>}
    </Container>
  );
}
