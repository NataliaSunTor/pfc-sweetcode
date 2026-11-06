import { useEffect, useState } from 'react';
import { Badge, Button, Container } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { get } from '../api/client.js';
import { fmtFecha } from '../utils/format.js';
import { Cargando, AlertaError } from '../components/Estado.jsx';

export default function ArticuloDetalle() {
  const { id } = useParams();
  const [articulo, setArticulo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCargando(true);
    get(`/api/articulos/${id}`)
      .then(setArticulo)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <Container className="py-5"><Cargando texto="Cargando artículo…" /></Container>;
  if (error || !articulo)
    return <Container className="py-5"><AlertaError error={error || 'Artículo no encontrado'} /></Container>;

  const autor = articulo.usuario ? `${articulo.usuario.nombre} ${articulo.usuario.apellidos}` : '';

  return (
    <Container className="py-5" style={{ maxWidth: 800 }}>
      <Button as={Link} to="/blog" variant="link" className="p-0 mb-3">
        ← Volver al blog
      </Button>
      <div className="d-flex align-items-center gap-2 mb-2">
        {articulo.categoria && (
          <Badge bg="secondary" className="sc-badge-categoria">
            {articulo.categoria.nombre}
          </Badge>
        )}
        <small className="text-muted">{fmtFecha(articulo.fecha)}</small>
        {autor && <small className="text-muted">· {autor}</small>}
      </div>
      <h1 className="sc-titulo mb-4">{articulo.titulo}</h1>
      {articulo.contenido.split(/\n+/).map((parrafo, i) => (
        <p key={i}>{parrafo}</p>
      ))}
      {articulo.etiquetas && (
        <p className="text-muted small mt-4">Etiquetas: {articulo.etiquetas}</p>
      )}
    </Container>
  );
}
