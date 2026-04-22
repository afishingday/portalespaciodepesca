/** Pestañas de contenido: orden y visibilidad los controla el superadmin (Cuentas / Actividad van aparte). */
export const PORTAL_CONTENT_SECTION_IDS = [
  'news',
  'pescaColombia',
  'proposals',
  'polls',
  'events',
  'records',
  'laganaWall',
  'talks',
  'species',
  'bitacora',
  'community',
  'directory',
  'legal',
]

export const PORTAL_SECTION_LABELS = {
  news: 'Noticias',
  pescaColombia: 'Pesca en Colombia',
  proposals: 'Propuestas',
  polls: 'Encuestas',
  events: 'Eventos',
  records: 'Récords',
  laganaWall: 'Muro de las Lagañas',
  talks: 'Charlas',
  species: 'Especies',
  bitacora: 'Mi bitácora',
  community: 'Servicios de nuestra comunidad',
  directory: 'Directorio de Pesca',
  legal: 'Aviso legal',
}

export function defaultSectionVisibility() {
  return Object.fromEntries(PORTAL_CONTENT_SECTION_IDS.map((id) => [id, true]))
}

export function mergeSectionVisibility(stored) {
  return { ...defaultSectionVisibility(), ...(stored && typeof stored === 'object' ? stored : {}) }
}

/** Orden del menú de contenido: lista de ids conocidos, sin duplicados; faltantes se agregan al final. */
export function mergeSectionOrder(stored) {
  const base = [...PORTAL_CONTENT_SECTION_IDS]
  if (!Array.isArray(stored) || stored.length === 0) return base
  const seen = new Set()
  const out = []
  for (const id of stored) {
    if (typeof id === 'string' && base.includes(id) && !seen.has(id)) {
      out.push(id)
      seen.add(id)
    }
  }
  for (const id of base) {
    if (!seen.has(id)) out.push(id)
  }
  return out
}

export function isPortalContentSection(tabId) {
  return PORTAL_CONTENT_SECTION_IDS.includes(tabId)
}
