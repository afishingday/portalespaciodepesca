const PORTAL_SESSION_KEY = 'ep_portal_session'

export function savePortalSession(username, password) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify({ username, password }))
}

export function clearPortalSession() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(PORTAL_SESSION_KEY)
}

export function readPortalSession() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(PORTAL_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.username !== 'string' || typeof parsed.password !== 'string') return null
    return { username: parsed.username, password: parsed.password }
  } catch {
    return null
  }
}
