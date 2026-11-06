import { Button, Container, Tab, Tabs } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext.jsx';
import PerfilForm from '../components/cuenta/PerfilForm.jsx';
import PedidosLista from '../components/cuenta/PedidosLista.jsx';
import DireccionesCrud from '../components/cuenta/DireccionesCrud.jsx';
import PresupuestosCrud from '../components/cuenta/PresupuestosCrud.jsx';

export default function MiCuenta() {
  const { usuario, salir } = useAuth();

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="sc-titulo mb-0">Hola, {usuario.nombre}</h1>
        <Button variant="outline-marron" size="sm" onClick={salir}>Cerrar sesión</Button>
      </div>
      <Tabs defaultActiveKey="perfil" className="mb-4">
        <Tab eventKey="perfil" title="Perfil">
          <PerfilForm />
        </Tab>
        <Tab eventKey="pedidos" title="Mis pedidos">
          <PedidosLista />
        </Tab>
        <Tab eventKey="direcciones" title="Direcciones">
          <DireccionesCrud />
        </Tab>
        <Tab eventKey="presupuestos" title="Presupuestos">
          <PresupuestosCrud />
        </Tab>
      </Tabs>
    </Container>
  );
}
