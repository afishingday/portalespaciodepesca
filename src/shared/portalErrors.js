/**
 * Mensaje legible para fallos al cambiar contraseña (Firestore, usuario local, etc.).
 * @param {unknown} ex
 * @returns {string}
 */
export function passwordChangeErrorMessage(ex) {
  const msg = ex && typeof ex.message === 'string' ? ex.message : ''
  const code = ex && typeof ex.code === 'string' ? ex.code : ''
  if (msg === 'WRONG_PASSWORD') return 'La contraseña actual es incorrecta.'
  if (msg === 'USER_NOT_FOUND') return 'No se encontró tu usuario en la base de datos.'
  if (msg === 'INVALID_NEW_PASSWORD') return 'La nueva contraseña no es válida.'
  if (code === 'permission-denied') {
    return 'El servidor rechazó el cambio (permisos). En Firebase Console, revisa las reglas de Firestore: debe permitirse actualizar users/{id} con el campo password.'
  }
  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return 'El servicio no respondió a tiempo. Intenta de nuevo en unos segundos.'
  }
  if (code === 'failed-precondition') {
    return 'No se pudo completar la operación en el servidor. Revisa la consola de Firebase.'
  }
  return 'No se pudo cambiar la clave. Si usas Firebase, abre la pestaña Red y busca peticiones en rojo o el código permission-denied.'
}
