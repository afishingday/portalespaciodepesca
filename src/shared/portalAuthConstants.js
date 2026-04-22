import { TENANT } from '../tenant.config.js'

/** Contraseña inicial retirada; sigue reconocida como «por defecto» y se migra a `DEFAULT_APPROVED_MEMBER_PASSWORD`. */
export const LEGACY_DEFAULT_APPROVED_MEMBER_PASSWORD = 'Club2026!!'

/** Contraseña por defecto del portal (solo lectura de `TENANT.portalDefaultPassword`). */
export const PORTAL_DEFAULT_PASSWORD =
  String(TENANT.portalDefaultPassword ?? '').trim() || 'Espacio2026!!'

/** @deprecated Usar `PORTAL_DEFAULT_PASSWORD`; se conserva el nombre por imports existentes. */
export const DEFAULT_APPROVED_MEMBER_PASSWORD = PORTAL_DEFAULT_PASSWORD

/** `localStorage`: migración única de clave inicial antigua → actual (Firestore y modo local). */
export const LEGACY_PASSWORD_MIGRATE_STORAGE_KEY = 'ep_portal_migrate_legacy_club2026_v1'

/** Claves que obligan a cambiar contraseña en el primer ingreso (salvo exenciones en `TENANT.forcePwdExempt`). */
export function isPortalDefaultPassword(username, password) {
  const p = String(password ?? '')
  if (!p) return false
  if (p === `${username}2026`) return true
  if (p === LEGACY_DEFAULT_APPROVED_MEMBER_PASSWORD) return true
  if (p === PORTAL_DEFAULT_PASSWORD) return true
  return false
}
