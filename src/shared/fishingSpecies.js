import { SPECIES_CATALOG } from '../data/speciesCatalog.js'

/**
 * Lista legacy (p. ej. especies de mar) que pueden no estar en el catálogo markdown.
 * Se añaden al final del desplegable de récords/bitácora solo si no duplican un nombre del catálogo.
 */
const RECORD_SPECIES_EXTRA = [
  'Marlín azul',
  'Marlín blanco',
  'Marlín negro',
  'Pez vela',
  'Dorado (Mahi-mahi)',
  'Peto (Wahoo)',
  'Atún aleta amarilla',
  'Atún patudo / ojo grande',
  'Bonito',
  'Pez gallo',
  'Barracuda',
  'Robalo',
  'Pargo',
  'Pargo cubera',
  'Mero / Cherna',
  'Tarpon',
  'Jurel / Jack',
  'Pámpano / Permit',
  'Corvina de mar',
  'Carite / Sierra',
]

/** Nombres del catálogo (misma lista que «Especies») + extras sin duplicar + «Otra». */
export const RECORD_SPECIES_OPTIONS = (() => {
  const fromCatalog = SPECIES_CATALOG.map((s) => s.name).filter(Boolean)
  const seen = new Set(fromCatalog.map((n) => n.toLocaleLowerCase('es')))
  const extras = []
  for (const x of RECORD_SPECIES_EXTRA) {
    const k = x.toLocaleLowerCase('es')
    if (!seen.has(k)) {
      seen.add(k)
      extras.push(x)
    }
  }
  extras.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
  return [...fromCatalog, ...extras, 'Otra']
})()

/** Valor por defecto en formularios de récord/bitácora (nombre que exista en la lista). */
export function defaultRecordSpeciesSelect() {
  if (RECORD_SPECIES_OPTIONS.includes('Mojarra azul')) return 'Mojarra azul'
  if (RECORD_SPECIES_OPTIONS.includes('Mojarra Azul')) return 'Mojarra Azul'
  const first = RECORD_SPECIES_OPTIONS.find((s) => s !== 'Otra')
  return first || 'Otra'
}

/**
 * @deprecated Preferir `RECORD_SPECIES_OPTIONS` para mantener una sola fuente con el catálogo.
 * Se conserva por si algún import antiguo aún lo usa.
 */
export const COMMON_SPECIES = RECORD_SPECIES_OPTIONS
