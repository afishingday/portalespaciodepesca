/** Fecha local de hoy en formato yyyy-mm-dd (para `<input type="date" />`). */
export function todayIsoDate() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Convierte valores guardados (ISO, ISO con hora, dd/mm/aaaa colombiano) a yyyy-mm-dd.
 */
export function parseToIsoDate(input) {
  const s = String(input ?? '').trim()
  if (!s) return todayIsoDate()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const head = s.slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(head)) return head
  }
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
  if (m) {
    const d = m[1].padStart(2, '0')
    const mo = m[2].padStart(2, '0')
    const y = m[3]
    return `${y}-${mo}-${d}`
  }
  const parsed = new Date(s)
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear()
    const mo = String(parsed.getMonth() + 1).padStart(2, '0')
    const day = String(parsed.getDate()).padStart(2, '0')
    return `${y}-${mo}-${day}`
  }
  return todayIsoDate()
}

/** Etiqueta legible (es-CO) para listas y detalle; acepta yyyy-mm-dd o formatos legacy. */
export function displayPortalDate(stored) {
  const s = String(stored ?? '').trim()
  if (!s) return ''
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : parseToIsoDate(s)
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO')
}

/**
 * Marca de tiempo para ordenar (más reciente = valor mayor).
 * Devuelve `null` si no hay una fecha interpretable.
 */
export function portalDateToSortMs(value) {
  if (value == null) return null
  const str = String(value).trim()
  if (!str) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, mo, d] = str.split('-').map(Number)
    const t = new Date(y, mo - 1, d, 12, 0, 0, 0).getTime()
    return Number.isNaN(t) ? null : t
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const t = Date.parse(str)
    return Number.isNaN(t) ? null : t
  }
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(str)
  if (m) {
    const t = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12, 0, 0, 0).getTime()
    return Number.isNaN(t) ? null : t
  }
  const t = Date.parse(str)
  return Number.isNaN(t) ? null : t
}

/**
 * Comparador para orden descendente: primero lo más reciente (`dateField`), luego por `id`.
 */
export function compareRowsChronologicalDesc(a, b, dateField = 'date') {
  const ta = portalDateToSortMs(a?.[dateField])
  const tb = portalDateToSortMs(b?.[dateField])
  const na = Number(a?.id)
  const nb = Number(b?.id)
  const ma = ta != null ? ta : (Number.isFinite(na) ? na : 0)
  const mb = tb != null ? tb : (Number.isFinite(nb) ? nb : 0)
  if (mb !== ma) return mb - ma
  return nb - na
}
