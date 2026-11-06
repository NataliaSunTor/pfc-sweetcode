import { Container } from 'react-bootstrap';
import CarritoContenido from '../components/CarritoContenido.jsx';

// En móvil el carrito es esta página; en desktop también existe el sidebar lateral
export default function Carrito() {
  return (
    <Container className="py-5" style={{ maxWidth: 720 }}>
      <h1 className="sc-titulo mb-4">Carrito</h1>
      <CarritoContenido />
    </Container>
  );
}
