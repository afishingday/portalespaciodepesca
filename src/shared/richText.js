/** Escape minimal entities for safe plain → HTML conversion. */
export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Legacy noticias/charlas (texto plano) → HTML mínimo para el editor. */
export function legacyPlainTextToHtml(text) {
  const raw = String(text ?? '').replace(/\r\n/g, '\n').trimEnd()
  if (!raw) return '<p></p>'
  return raw
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`)
    .join('')
}

/** Texto visible (p. ej. para IA) sin etiquetas. */
export function stripHtmlToPlain(html) {
  if (typeof document === 'undefined') {
    return String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const d = document.createElement('div')
  d.innerHTML = String(html ?? '')
  return (d.textContent || '').replace(/\s+/g, ' ').trim()
}

/** ¿Hay algo que mostrar distinto de un documento vacío? */
export function hasMeaningfulHtmlBody(html) {
  return stripHtmlToPlain(html).length > 0
}

/** Resultado de IA u otro texto plano → párrafos simples en HTML. */
export function plainParagraphsToHtml(text) {
  const t = String(text ?? '').trim()
  if (!t) return '<p></p>'
  return t
    .split(/\n\s*\n/)
    .map((block) => `<p>${escapeHtml(block.trim()).replace(/\n/g, '<br />')}</p>`)
    .join('')
}
