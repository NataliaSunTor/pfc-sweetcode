import { Alert, Spinner } from 'react-bootstrap';

export function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="d-flex align-items-center gap-2 py-4 justify-content-center">
      <Spinner animation="border" size="sm" role="status" />
      <span>{texto}</span>
    </div>
  );
}

export function AlertaError({ error }) {
  if (!error) return null;
  return (
    <Alert variant="danger" className="my-3">
      {error}
    </Alert>
  );
}
