// Placeholders de las páginas que faltan (Sobre nosotros / Contacto).
// El resto ya tienen archivo propio en pages/.
import PaginaBase from '../components/PaginaBase.jsx';

export const SobreNosotros = () => <PaginaBase titulo="Sobre nosotros" />;
export const Contacto = () => <PaginaBase titulo="Contacto" />;
export const NoEncontrada = () => <PaginaBase titulo="Página no encontrada" />;
