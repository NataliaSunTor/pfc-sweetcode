import { markdownBloques } from '../utils/markdown.js';

// Renderiza el contenido del blog con formato markdown básico (ver utils/markdown.js)
export default function MarkdownLite({ contenido }) {
  const bloques = markdownBloques(contenido);
  return (
    <div className="sc-contenido-blog">
      {bloques.map((b, i) => {
        if (b.tipo === 'ul') {
          return (
            <ul key={i}>
              {b.items.map((item, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
          );
        }
        if (b.tipo === 'h1') return <h1 key={i} dangerouslySetInnerHTML={{ __html: b.html }} />;
        if (b.tipo === 'h2') return <h2 key={i} dangerouslySetInnerHTML={{ __html: b.html }} />;
        if (b.tipo === 'h3') return <h3 key={i} dangerouslySetInnerHTML={{ __html: b.html }} />;
        return <p key={i} dangerouslySetInnerHTML={{ __html: b.html }} />;
      })}
    </div>
  );
}
