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

function isPescaColombiaChapterFile(name) {
  if (!/^\d{2}-.+\.md$/.test(name)) return false
  if (/\(1\)\.md$/i.test(name)) return false
  return true
}

function parseFrontmatter(raw) {
  const text = String(raw ?? '').replace(/^\uFEFF/, '')
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/m.exec(text)
  if (!m) return null
  try {
    const fm = YAML.parse(m[1])
    return { fm, body: m[2] }
  } catch {
    return null
  }
}

/** Capítulos guía 01…07 (Lasso et al.), ordenados, sin duplicados *(1).md. */
export function getPescaColombiaChapters() {
  const out = []
  for (const path of Object.keys(rawModules)) {
    const filename = basenameFromPath(path)
    if (!isPescaColombiaChapterFile(filename)) continue
    const raw = rawModules[path]
    const parsed = parseFrontmatter(raw)
    if (!parsed) continue
    const { fm, body } = parsed
    if (fm && fm.seccion && String(fm.seccion).toLowerCase() !== 'paginas') continue
    const titulo = String(fm.titulo || filename.replace(/\.md$/i, '')).trim()
    const orden = Number(fm.orden) || 0
    out.push({
      id: String(fm.slug || filename.replace(/\.md$/i, '')).trim(),
      filename,
      titulo,
      orden,
      body: String(body ?? '').trim(),
    })
  }
  out.sort((a, b) => {
    if (a.orden && b.orden && a.orden !== b.orden) return a.orden - b.orden
    return a.filename.localeCompare(b.filename, 'es')
  })
  return out
}

export const PESCA_COLOMBIA_CHAPTERS = getPescaColombiaChapters()
