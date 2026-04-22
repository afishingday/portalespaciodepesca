import YAML from 'yaml'

const rawModules = import.meta.glob('../content/species/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

function basenameFromPath(p) {
  const norm = String(p || '').replace(/\\/g, '/')
  const i = norm.lastIndexOf('/')
  return i >= 0 ? norm.slice(i + 1) : norm
}

function isSpeciesMarkdownFile(filename) {
  if (!filename.endsWith('.md')) return false
  if (filename === 'README.md') return false
  if (filename === '_plantilla.md') return false
  if (/^\d{2}-/.test(filename)) return false
  if (/\(1\)\.md$/i.test(filename)) return false
  return true
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Extrae texto bajo un encabezado `##` o `###` hasta el siguiente mismo nivel o superior. */
function extractSection(markdown, title) {
  const norm = markdown.replace(/\r\n/g, '\n')
  const re = new RegExp(
    `^#{2,3}\\s+${escapeRe(title)}\\s*\\n([\\s\\S]*?)(?=\\n#{1,3}\\s[^\\n]+|$)`,
    'm',
  )
  const m = norm.match(re)
  if (!m) return ''
  return m[1]
    .replace(/\n#{4,6}[^\n]+\n?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function joinList(arr) {
  if (!Array.isArray(arr)) return ''
  return arr.map((x) => String(x ?? '').trim()).filter(Boolean).join(' · ')
}

function formatVedas(v) {
  if (!v || !Array.isArray(v)) return ''
  return v
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (item && typeof item === 'object') {
        return [item.norma, item.periodo, item.zona].filter(Boolean).join(' — ')
      }
      return ''
    })
    .filter(Boolean)
    .join(' · ')
}

function parseFrontmatterAndBody(raw) {
  const text = String(raw ?? '').replace(/^\uFEFF/, '')
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/m.exec(text)
  if (!m) return null
  try {
    const fm = YAML.parse(m[1])
    return { fm, body: m[2].trim() }
  } catch {
    return null
  }
}

function buildTip(fm, body) {
  const parts = []
  if (fm.temporada_recomendada) parts.push(String(fm.temporada_recomendada).trim())
  if (fm.dificultad) parts.push(`Dificultad: ${String(fm.dificultad).trim()}.`)
  const consejos =
    extractSection(body, 'Temporada y consejos') ||
    extractSection(body, 'Técnicas y equipos') ||
    ''
  if (consejos) parts.push(consejos.slice(0, 420))
  const v = formatVedas(fm.vedas)
  if (v) parts.push(`Normativa: ${v.slice(0, 320)}`)
  if (fm.restricciones_adicionales) parts.push(String(fm.restricciones_adicionales).trim().slice(0, 280))
  return parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 1400)
}

function buildHabitat(fm) {
  const bits = []
  if (fm.habitat) bits.push(String(fm.habitat).trim())
  if (Array.isArray(fm.cuencas) && fm.cuencas.length)
    bits.push(`Cuencas: ${fm.cuencas.join(', ')}.`)
  return bits.join(' ').trim()
}

function buildDescription(fm, body) {
  const fromBody = extractSection(body, 'Descripción general')
  if (fromBody) return fromBody.slice(0, 900)
  if (fm.dieta) return String(fm.dieta).trim().slice(0, 500)
  return (fm.titulo && String(fm.titulo)) || ''
}

/**
 * @typedef {{ slug: string, name: string, scientific: string, family: string, description: string, habitat: string, gear: string, lures: string, tip: string, bodyMarkdown: string }} SpeciesCatalogEntry
 */

/** @type {SpeciesCatalogEntry[]} */
function buildCatalog() {
  /** @type {SpeciesCatalogEntry[]} */
  const rows = []
  for (const path of Object.keys(rawModules)) {
    const filename = basenameFromPath(path)
    if (!isSpeciesMarkdownFile(filename)) continue
    const raw = rawModules[path]
    if (typeof raw !== 'string') continue
    const parsed = parseFrontmatterAndBody(raw)
    if (!parsed) continue
    const { fm, body } = parsed
    if (fm.seccion === 'paginas') continue
    if (!fm.nombre_cientifico || !fm.titulo || !fm.familia) continue

    const stem = filename.replace(/\.md$/i, '')
    const slug = String(fm.slug || stem).trim() || stem

    const methods = joinList(fm.metodos_captura)
    const equipos = joinList(fm.equipos_recomendados)
    const gear = [methods, equipos].filter(Boolean).join(' — ')

    rows.push({
      slug,
      name: String(fm.titulo).trim(),
      scientific: String(fm.nombre_cientifico).trim(),
      family: String(fm.familia).trim(),
      description: buildDescription(fm, body),
      habitat: buildHabitat(fm) || '—',
      gear: gear || '—',
      lures: joinList(fm.senuelos_carnadas) || '—',
      tip: buildTip(fm, body) || '—',
      bodyMarkdown: body,
    })
  }
  rows.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
  return rows
}

export const SPECIES_CATALOG = buildCatalog()
