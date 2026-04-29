import { useEffect, useState } from 'react'
import { subscribeReactionsOnDocument } from './reactionsFirestore.js'
import { normalizeReactions } from './reactionKeys.js'

const EMPTY = () => normalizeReactions(undefined)

/**
 * @param {{ db: import('firebase/firestore').Firestore | null, enabled?: boolean, appContext: string, contentType: string, contentId: string|number|null|undefined }} opts
 */
export function useReactionsSubscription({ db, enabled = true, appContext, contentType, contentId }) {
  const [reactions, setReactions] = useState(EMPTY)
  const [error, setError] = useState(null)

  useEffect(() => {
    setError(null)
    if (!enabled || !db || contentId == null || contentId === '') {
      setReactions(EMPTY())
      return undefined
    }
    return subscribeReactionsOnDocument(
      db,
      { appContext, contentType, contentId },
      setReactions,
      setError,
    )
  }, [db, enabled, appContext, contentType, contentId])

  return { reactions, error }
}
