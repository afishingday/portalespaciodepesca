import { TENANT } from '../tenant.config.js'

/**
 * Id registrado con `registerAppContext` en firebase.js.
 * Cada despliegue con su propio proyecto o datos debe usar un id estable (p. ej. `lasBlancas`) para no mezclar reacciones entre portales si compartieran backend.
 */
export const PORTAL_REACTION_APP_CONTEXT = (() => {
  const id = String(TENANT.reactionAppContextId ?? 'espacioPesca').trim()
  return id || 'espacioPesca'
})()
