/** Claves persistidas en `reactions.<key>` (arrays de ids de usuario en Firestore). */
export const REACTION_KEYS = ['heart', 'clap', 'wow', 'seedling']

export const REACTION_DEFS = [
  { key: 'heart', emoji: '❤️', label: 'Me encanta' },
  { key: 'clap', emoji: '👏', label: 'Aplauso' },
  { key: 'wow', emoji: '😮', label: 'Wow' },
  { key: 'seedling', emoji: '🌱', label: 'Buena onda' },
]

export function normalizeReactions(raw) {
  const out = {}
  for (const k of REACTION_KEYS) {
    const v = raw?.[k]
    out[k] = Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()) : []
  }
  return out
}
