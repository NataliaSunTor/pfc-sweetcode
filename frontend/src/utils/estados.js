// Variantes de badge de Bootstrap según el estado devuelto por la API
const VARIANTES_PEDIDO = {
  pendiente: 'warning',
  en_preparacion: 'info',
  enviado: 'primary',
  entregado: 'success',
  cancelado: 'danger',
};

const VARIANTES_PRESUPUESTO = {
  pendiente: 'warning',
  presupuestado: 'info',
  aceptado: 'success',
  rechazado: 'danger',
};

export function variantePedido(estado) {
  return VARIANTES_PEDIDO[estado] ?? 'secondary';
}

export function variantePresupuesto(estado) {
  return VARIANTES_PRESUPUESTO[estado] ?? 'secondary';
}
