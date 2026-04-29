/**
 * Interpreta `record.weight` (ej. "28 lb", "4.5 kg") y devuelve libras para comparar marcas.
 * @param {string | undefined} weightStr
 * @returns {number}
 */
export function parseRecordWeightToLb(weightStr) {
  if (weightStr == null || typeof weightStr !== 'string') return NaN
  const parts = weightStr.trim().split(/\s+/)
  const n = parseFloat(String(parts[0]).replace(',', '.'))
  if (!Number.isFinite(n)) return NaN
  const unit = String(parts[1] || 'lb').toLowerCase()
  if (unit === 'kg') return n * 2.2046226218
  if (unit === 'g') return n / 453.59237
  return n
}

/**
 * Mejor récord del usuario para una especie (mayor peso en lb).
 * @param {Array<{ id: unknown, species?: string, anglerUsername?: string, weight?: string }>} records
 * @param {string} username
 * @param {string} species
 * @returns {object | null}
 */
export function findPersonalBestRecord(records, username, species) {
  if (!username || !species || !Array.isArray(records)) return null
  const list = records.filter(
    (r) => r && r.anglerUsername === username && r.species === species,
  )
  if (list.length === 0) return null
  let best = list[0]
  let bestLb = parseRecordWeightToLb(best.weight)
  for (let i = 1; i < list.length; i += 1) {
    const r = list[i]
    const w = parseRecordWeightToLb(r.weight)
    if (!Number.isFinite(bestLb) && Number.isFinite(w)) {
      best = r
      bestLb = w
      continue
    }
    if (Number.isFinite(w) && w > bestLb) {
      best = r
      bestLb = w
    }
  }
  return best
}

/**
 * Longitud total almacenada en `lengthCm` (número en centímetros).
 * @param {unknown} record
 * @returns {number}
 */
export function parseRecordLengthCm(record) {
  const n = Number(record?.lengthCm)
  if (!Number.isFinite(n) || n <= 0) return NaN
  return n
}

/**
 * Texto para tarjetas y detalle: peso tal como se guardó (ej. "28 lb") y/o "92 cm".
 */
export function formatRecordSizeDisplay(record) {
  const parts = []
  const ws = String(record?.weight ?? '').trim()
  if (ws) parts.push(ws)
  const cm = parseRecordLengthCm(record)
  if (Number.isFinite(cm)) {
    const rounded = Math.round(cm * 100) / 100
    const label = Number.isInteger(rounded) ? String(rounded) : String(rounded)
    parts.push(`${label} cm`)
  }
  return parts.length ? parts.join(' · ') : '—'
}
