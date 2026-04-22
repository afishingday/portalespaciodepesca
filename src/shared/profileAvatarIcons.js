/**
 * Iconos de perfil en `src/assets/icons`.
 *
 * Cualquier imagen nueva en esa carpeta se incluye al volver a ejecutar el build o el servidor de desarrollo
 * (`import.meta.glob` se resuelve en tiempo de compilación de Vite).
 *
 * En Firestore / usuario se guarda el `id`: nombre del archivo **sin** extensión (p. ej. `1` para `1.png`).
 */

const raw = import.meta.glob('../assets/icons/*.{png,jpg,jpeg,webp,svg,gif}', {
  eager: true,
  import: 'default',
})

function basenameFromPath(p) {
  const norm = String(p || '').replace(/\\/g, '/')
  const i = norm.lastIndexOf('/')
  return i >= 0 ? norm.slice(i + 1) : norm
}

function stem(filename) {
  const m = /^(.+)(\.[a-z0-9]+)$/i.exec(filename)
  return m ? m[1] : filename
}

function buildList() {
  const list = []
  for (const path of Object.keys(raw)) {
    const url = raw[path]
    if (typeof url !== 'string') continue
    const filename = basenameFromPath(path)
    if (!filename || filename.startsWith('.')) continue
    const id = stem(filename)
    list.push({
      id,
      filename,
      label: id,
      src: url,
    })
  }
  list.sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }),
  )
  return list
}

export const PROFILE_AVATAR_ICONS = buildList()

/**
 * @param {string | undefined | null} avatarId
 * @returns {{ id: string, filename: string, label: string, src: string } | null}
 */
export function getProfileAvatarById(avatarId) {
  const id = String(avatarId ?? '').trim()
  if (!id) return null
  return PROFILE_AVATAR_ICONS.find((x) => x.id === id) || null
}
