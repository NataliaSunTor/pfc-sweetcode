// Markdown muy básico para el blog: títulos (#, ##, ###), listas (-), negrita (**),
// cursiva (*), código (`) y enlaces [texto](https://...).
// Todo se escapa antes de generar HTML, así que es seguro usar dangerouslySetInnerHTML.

function escaparHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function markdownInline(texto) {
  let s = escaparHtml(texto);
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}

// Devuelve bloques: [{ tipo: 'h1'|'h2'|'h3'|'p', html } | { tipo: 'ul', items: [html] }]
export function markdownBloques(contenido) {
  const bloques = [];
  let lista = null;
  for (const linea of String(contenido || '').split(/\r?\n/)) {
    const l = linea.trim();
    if (!l) { lista = null; continue; }
    let m;
    if ((m = l.match(/^###\s+(.*)/))) { lista = null; bloques.push({ tipo: 'h3', html: markdownInline(m[1]) }); }
    else if ((m = l.match(/^##\s+(.*)/))) { lista = null; bloques.push({ tipo: 'h2', html: markdownInline(m[1]) }); }
    else if ((m = l.match(/^#\s+(.*)/))) { lista = null; bloques.push({ tipo: 'h1', html: markdownInline(m[1]) }); }
    else if ((m = l.match(/^[-*]\s+(.*)/))) {
      if (!lista) { lista = []; bloques.push({ tipo: 'ul', items: lista }); }
      lista.push(markdownInline(m[1]));
    } else {
      lista = null;
      bloques.push({ tipo: 'p', html: markdownInline(l) });
    }
  }
  return bloques;
}

// Quita los marcadores markdown (para el extracto de las tarjetas del blog)
export function stripMarkdown(texto) {
  return String(texto || '')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
    .replace(/[#*`]/g, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1');
}
