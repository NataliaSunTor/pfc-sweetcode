const fmtMoneda = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export function fmtPrecio(valor) {
  return fmtMoneda.format(Number(valor) || 0);
}

export function fmtFecha(fecha) {
  if (!fecha) return '';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(fecha)
  );
}

export function fmtFechaCorta(fecha) {
  if (!fecha) return '';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(fecha)
  );
}
