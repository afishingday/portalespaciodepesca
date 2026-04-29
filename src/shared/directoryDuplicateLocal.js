/**
 * Detección local de duplicados obvios en el Directorio de Pesca (sin IA).
 * Complementa a Gemini para teléfono, correo, redes y variantes triviales de nombre (ej. "AF Fishing" vs "AFFishing").
 */

/** Solo dígitos, para comparar teléfonos / WhatsApp. */
export function normalizeDirectoryPhoneDigits(phone) {
  return String(phone ?? '').replace(/\D/g, '')
}

/** Nombre sin espacios ni puntuación, minúsculas, sin acentos — "AF Fishing" y "AFFishing" → "affishing". */
export function collapseDirectoryNameKey(name) {
  return String(name ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Tokens de redes: @usuario, rutas instagram/facebook/tiktok/youtube.
 * @returns {Set<string>}
 */
export function extractDirectorySocialKeys(text) {
  const raw = String(text ?? '').toLowerCase()
  const out = new Set()
  for (const m of raw.matchAll(/@([a-z0-9._]{2,40})/gi)) {
    out.add(`@${m[1]}`.replace(/\.$/, ''))
  }
  for (const m of raw.matchAll(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-z0-9._]+)/gi)) {
    out.add(`ig:${m[1].replace(/\/$/, '')}`)
  }
  for (const m of raw.matchAll(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-z0-9._]+)/gi)) {
    out.add(`fb:${m[1].replace(/\/$/, '')}`)
  }
  for (const m of raw.matchAll(/(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@?([a-z0-9._]+)/gi)) {
    out.add(`tt:${m[1]}`)
  }
  for (const m of raw.matchAll(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:c\/|channel\/|user\/|@)?([a-z0-9._-]+)/gi)) {
    out.add(`yt:${m[1]}`)
  }
  return out
}

/**
 * @param {{ name: string, phone?: string, email?: string, webSocial?: string }} candidate
 * @param {Array<{ id?: unknown, name?: string, phone?: string, email?: string, webSocial?: string }>} existing
 * @param {string | null} excludeId — al editar, ignorar la misma ficha
 * @returns {string[]} mensajes en español (vacío si nada)
 */
export function findLocalDirectoryDuplicateWarnings(candidate, existing, excludeId) {
  const warnings = []
  const name = String(candidate.name ?? '').trim()
  const phoneDigits = normalizeDirectoryPhoneDigits(candidate.phone)
  const email = String(candidate.email ?? '').trim().toLowerCase()
  const socialNew = extractDirectorySocialKeys(candidate.webSocial)
  const nameKey = collapseDirectoryNameKey(name)
  const minNameKeyLen = 4

  for (const row of existing || []) {
    if (excludeId != null && String(row?.id) === String(excludeId)) continue
    const otherName = String(row?.name ?? '').trim()
    if (!otherName) continue

    if (nameKey.length >= minNameKeyLen && nameKey === collapseDirectoryNameKey(otherName)) {
      warnings.push(`• Mismo nombre (variaciones de espacios o mayúsculas): ya existe «${otherName}».`)
    }

    if (phoneDigits.length >= 8) {
      const od = normalizeDirectoryPhoneDigits(row?.phone)
      if (od.length >= 8 && od === phoneDigits) {
        warnings.push(`• Mismo teléfono o WhatsApp que «${otherName}».`)
      }
    }

    if (email && String(row?.email ?? '').trim().toLowerCase() === email) {
      warnings.push(`• Mismo correo que «${otherName}».`)
    }

    const socialOld = extractDirectorySocialKeys(row?.webSocial)
    for (const token of socialNew) {
      if (socialOld.has(token)) {
        warnings.push(`• Misma red o usuario (@/enlace) que «${otherName}».`)
        break
      }
    }
  }

  return [...new Set(warnings)]
}
