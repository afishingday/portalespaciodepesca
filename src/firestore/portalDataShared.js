import { compareRowsChronologicalDesc } from '../shared/portalDates.js'

export const COLLECTION_NAMES = [
  'users',
  'pendingUsers',
  'news',
  'proposals',
  'polls',
  'events',
  'records',
  'talks',
  'bitacora',
  'communityPosts',
  'directoryEntries',
  'logs',
]

export function stripForFirestore(value) {
  return JSON.parse(JSON.stringify(value))
}

/** Directorio de Pesca: orden alfabético por nombre (es-CO), desempate estable por `id`. */
export function compareDirectoryEntriesByNameAsc(a, b) {
  const na = String(a?.name ?? '').trim()
  const nb = String(b?.name ?? '').trim()
  const c = na.localeCompare(nb, 'es', { sensitivity: 'base' })
  if (c !== 0) return c
  return Number(a?.id) - Number(b?.id)
}

/** Listas del portal: más reciente primero (por campo `date`, desempate `id`), salvo directorio (por nombre). */
export function sortRows(name, rows) {
  if (name === 'directoryEntries') {
    return [...rows].sort(compareDirectoryEntriesByNameAsc)
  }
  if (['news', 'proposals', 'polls', 'records', 'talks', 'events', 'communityPosts'].includes(name)) {
    return [...rows].sort((a, b) => compareRowsChronologicalDesc(a, b, 'date'))
  }
  if (name === 'logs')
    return [...rows].sort((a, b) => Number(b.id) - Number(a.id))
  return rows
}
