/**
 * Nombre de usuario del portal (documento Firestore `users/{username}`).
 * Solo letras (incl. acentos y ñ), números y guion bajo; sin espacios ni símbolos.
 */

const USERNAME_RE = /^[\p{L}\p{N}_]{3,30}$/u

const RESERVED = new Set(['guest', 'system', 'null', 'undefined'])

/**
 * Quita espacios y caracteres no permitidos mientras el usuario escribe.
 */
export function sanitizePortalUsernameInput(raw) {
  return String(raw ?? '')
    .replace(/[^\p{L}\p{N}_]/gu, '')
    .slice(0, 30)
}

/**
 * @param {string} sanitized — resultado de `sanitizePortalUsernameInput` (o equivalente ya limpio)
 */
export function validatePortalUsername(sanitized) {
  const t = String(sanitized ?? '')
  if (t.length < 3) {
    return { ok: false, message: 'El usuario debe tener al menos 3 caracteres (solo letras, números o _).' }
  }
  if (t.length > 30) {
    return { ok: false, message: 'El usuario admite máximo 30 caracteres.' }
  }
  if (!USERNAME_RE.test(t)) {
    return {
      ok: false,
      message: 'El usuario solo puede incluir letras, números y guion bajo (_). No uses espacios ni símbolos como @, #, /, etc.',
    }
  }
  if (RESERVED.has(t.toLowerCase())) {
    return { ok: false, message: 'Ese nombre de usuario está reservado. Elige otro.' }
  }
  return { ok: true, username: t }
}
