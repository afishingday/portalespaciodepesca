/** @type {Map<string, Record<string, { collection: string }>>} */
const contexts = new Map()

/**
 * Registra el mapa de tipos de contenido → colección Firestore para un contexto de app.
 * @param {string} appContextId ej. 'espacioPesca'
 * @param {Record<string, { collection: string }>} spec
 */
export function registerAppContext(appContextId, spec) {
  if (!appContextId || typeof appContextId !== 'string') throw new Error('registerAppContext: appContextId inválido')
  if (!spec || typeof spec !== 'object') throw new Error('registerAppContext: spec inválido')
  contexts.set(appContextId, Object.freeze({ ...spec }))
}

export function getRegisteredContext(appContextId) {
  const s = contexts.get(appContextId)
  if (!s) throw new Error(`Contexto de app no registrado: "${appContextId}". Llama registerAppContext antes.`)
  return s
}

export function getCollectionForContentType(appContextId, contentType) {
  const ctx = getRegisteredContext(appContextId)
  const entry = ctx[contentType]
  if (!entry?.collection) {
    throw new Error(`Tipo de contenido desconocido "${contentType}" para contexto "${appContextId}"`)
  }
  return entry.collection
}
