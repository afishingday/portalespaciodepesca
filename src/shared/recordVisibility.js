/** Visible en el muro para visitantes y cuentas registradas (no oculto por el autor ni por moderación). */
export function isPublicOnClubWall(record) {
  return Boolean(record) && record.clubVisible !== false && !record.adminSuppressed
}

/**
 * Si el récord debe listarse en la grilla para quien está viendo.
 * @param {object} record
 * @param {{ username?: string, role?: string }} currentUser
 * @param {boolean} isModerator isAdminLike
 */
export function recordShownInRecordsGrid(record, currentUser, isModerator) {
  if (!record) return false
  if (isModerator) return true
  const u = currentUser?.username
  if (u && record.anglerUsername === u) return true
  return isPublicOnClubWall(record)
}

/**
 * Artículos de «Información de interés» (news): visibles salvo retiro por moderación;
 * el autor y los administradores siguen viendo el documento.
 */
export function newsArticleShownInFeed(article, currentUser, isModerator) {
  if (!article) return false
  if (isModerator) return true
  const u = currentUser?.username
  if (u && article.authorUsername === u) return true
  return article.adminSuppressed !== true
}
