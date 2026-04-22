import DOMPurify from 'dompurify'

const YOUTUBE_EMBED_RE = /^https:\/\/www\.youtube(-nocookie)?\.com\/embed\/[a-zA-Z0-9_-]{11}(\?.*)?$/

/**
 * HTML generado por el portal (TipTap) listo para inyectar en el DOM.
 * Solo iframes de embed de YouTube; resto de etiquetas restringidas.
 */
export function sanitizePortalHtml(dirty) {
  const s = String(dirty ?? '').trim()
  if (!s) return ''

  DOMPurify.removeAllHooks()
  DOMPurify.addHook('uponSanitizeElement', (node) => {
    if (node.nodeName === 'IFRAME') {
      const src = node.getAttribute('src') || ''
      if (!YOUTUBE_EMBED_RE.test(src)) {
        node.remove()
      } else {
        node.setAttribute('loading', 'lazy')
        node.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
      }
    }
  })

  const clean = DOMPurify.sanitize(s, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'span', 'a',
      'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'iframe',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'colspan', 'rowspan',
      'src', 'width', 'height', 'title', 'allow', 'allowfullscreen',
      'frameborder', 'loading', 'referrerpolicy', 'data-youtube-video',
    ],
    ADD_ATTR: ['allowfullscreen'],
    ALLOW_DATA_ATTR: false,
  })

  DOMPurify.removeAllHooks()
  return clean
}
