/**
 * Mapa de tipos de contenido del portal → colecciones Firestore reales.
 * Las claves son las que pasas como `contentType` a ReactionBar / subscribe / toggle.
 */
export const ESPACIO_PESCA_REACTIONS_SPEC = Object.freeze({
  news: { collection: 'news' },
  proposals: { collection: 'proposals' },
  polls: { collection: 'polls' },
  events: { collection: 'events' },
  records: { collection: 'records' },
  laganaWall: { collection: 'laganaWallPosts' },
  talks: { collection: 'talks' },
  bitacora: { collection: 'bitacora' },
  communityPosts: { collection: 'communityPosts' },
  directoryEntries: { collection: 'directoryEntries' },
})
