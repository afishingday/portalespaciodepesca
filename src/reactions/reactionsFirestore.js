import {
  doc,
  onSnapshot,
  runTransaction,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { REACTION_KEYS, normalizeReactions } from './reactionKeys.js'
import { getCollectionForContentType } from './registry.js'

function contentDocRef(db, appContext, contentType, contentId) {
  const collectionName = getCollectionForContentType(appContext, contentType)
  return doc(db, collectionName, String(contentId))
}

/**
 * Suscripción en vivo al campo `reactions` de un documento.
 * @param {(reactions: Record<string, string[]>) => void} onUpdate
 * @returns {() => void}
 */
export function subscribeReactionsOnDocument(db, { appContext, contentType, contentId }, onUpdate, onError) {
  if (!db) return () => {}
  const ref = contentDocRef(db, appContext, contentType, contentId)
  return onSnapshot(
    ref,
    (snap) => {
      const raw = snap.exists() ? snap.data()?.reactions : undefined
      onUpdate(normalizeReactions(raw))
    },
    (err) => {
      if (typeof onError === 'function') onError(err)
      else console.error('[reactions]', err)
    },
  )
}

/**
 * Alterna la presencia de `userId` en `reactions[reactionKey]` con transacción (arrayUnion / arrayRemove).
 * @param {{ appContext: string, contentType: string, contentId: string|number }} target
 */
export async function toggleUserReactionOnDocument(db, target, reactionKey, userId) {
  if (!db) throw new Error('Firestore no inicializado')
  const uid = String(userId ?? '').trim()
  if (!uid) throw new Error('userId requerido para reaccionar')
  if (!REACTION_KEYS.includes(reactionKey)) throw new Error(`Clave de reacción no válida: ${reactionKey}`)

  const { appContext, contentType, contentId } = target
  const ref = contentDocRef(db, appContext, contentType, contentId)

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref)
    if (!snap.exists()) throw new Error('DOCUMENT_NOT_FOUND')
    const raw = snap.data()?.reactions
    const cur = normalizeReactions(raw)[reactionKey]
    if (cur.includes(uid)) {
      transaction.update(ref, { [`reactions.${reactionKey}`]: arrayRemove(uid) })
    } else {
      transaction.update(ref, { [`reactions.${reactionKey}`]: arrayUnion(uid) })
    }
  })
}
