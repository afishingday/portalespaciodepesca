import { polishSpanishField } from '../geminiClient.js'
import { TENANT } from '../tenant.config.js'
import { getProfileAvatarById } from './profileAvatarIcons.js'

export const SITE_BRAND_TITLE = TENANT.fullName

export const isAdminLike = (user) => user?.role === 'admin' || user?.role === 'superadmin'

export const isGuest = (user) => user?.role === 'guest'

export const safeDateParse = (dateString) => {
  if (!dateString) return { isClosed: false, formatted: 'Sin fecha límite' }
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return { isClosed: false, formatted: 'Fecha inválida' }
  return {
    isClosed: new Date() > d,
    formatted: d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
  }
}

export function getTimeRemainingLabel(dateString) {
  if (!dateString) return null
  const ms = new Date(dateString).getTime()
  if (Number.isNaN(ms)) return null
  const diffMs = ms - Date.now()
  if (diffMs <= 0) return null
  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days >= 1) return `Quedan ${days} día${days === 1 ? '' : 's'}`
  if (hours >= 1) return `Quedan ${hours} h`
  if (minutes >= 1) return `Quedan ${minutes} min`
  return 'Quedan menos de 1 min'
}

export function toLocalDatetimeInputValue(d) {
  const t = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(t.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`
}

export function formatPortalEventWhen(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Fecha por confirmar'
  return d.toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })
}

export function checkStrongPassword(raw) {
  const pwd = String(raw ?? '')
  return {
    ok: pwd.length >= 8 && /[A-Za-z]/.test(pwd) && /\d/.test(pwd),
    hasLength: pwd.length >= 8,
    hasLetter: /[A-Za-z]/.test(pwd),
    hasNumber: /\d/.test(pwd),
  }
}

export async function requestPolishedText(kind, text) {
  if (!text?.trim()) return ''
  const out = await polishSpanishField(kind, text)
  return out?.trim() ? out.trim() : ''
}

export function getAvatarById(avatarId) {
  return getProfileAvatarById(avatarId)
}

export { PROFILE_AVATAR_ICONS } from './profileAvatarIcons.js'

export const coerceSurveyOptionId = (options, raw) => {
  const match = (options || []).find((o) => String(o.id) === String(raw))
  return match ? match.id : raw
}

export function isVotingClosed(poll) {
  if (poll?.votingClosed === true) return true
  return safeDateParse(poll?.deadline).isClosed
}
