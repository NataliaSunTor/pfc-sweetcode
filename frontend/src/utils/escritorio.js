// breakpoint lg de Bootstrap = 992px
export function esEscritorio() {
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 992px)').matches;
}
