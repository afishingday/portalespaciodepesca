import { useCallback, useState } from 'react'
import './reactionBar.css'
import { REACTION_DEFS } from './reactionKeys.js'
import { useReactionsSubscription } from './useReactionsSubscription.js'
import { toggleUserReactionOnDocument } from './reactionsFirestore.js'

/**
 * @param {{
 *   db: import('firebase/firestore').Firestore | null,
 *   appContext: string,
 *   contentType: string,
 *   contentId: string|number,
 *   userId: string | null,
 *   theme?: 'light' | 'dark',
 *   className?: string,
 * }} props
 */
export default function ReactionBar({
  db,
  appContext,
  contentType,
  contentId,
  userId,
  theme = 'light',
  className = '',
}) {
  const { reactions } = useReactionsSubscription({
    db,
    enabled: Boolean(db && contentId != null && contentId !== ''),
    appContext,
    contentType,
    contentId,
  })
  const [busyKey, setBusyKey] = useState(null)

  const canToggle = Boolean(db && userId && String(userId).trim())

  const onToggle = useCallback(
    async (key) => {
      if (!canToggle || !db) return
      setBusyKey(key)
      try {
        await toggleUserReactionOnDocument(
          db,
          { appContext, contentType, contentId },
          key,
          String(userId).trim(),
        )
      } catch (e) {
        console.error('[ReactionBar]', e)
      } finally {
        setBusyKey(null)
      }
    },
    [appContext, canToggle, contentId, contentType, db, userId],
  )

  const themeClass = theme === 'dark' ? 'reaction-bar--theme-dark' : 'reaction-bar--theme-light'

  return (
    <div
      className={`reaction-bar ${themeClass} ${className}`.trim()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="group"
      aria-label="Reacciones"
    >
      {REACTION_DEFS.map(({ key, emoji, label }) => {
        const list = reactions[key] || []
        const active = canToggle && list.includes(String(userId).trim())
        return (
          <button
            key={key}
            type="button"
            title={label}
            aria-pressed={active}
            aria-label={`${label}: ${list.length}`}
            disabled={!canToggle || busyKey === key}
            className={`reaction-bar__btn${active ? ' reaction-bar__btn--active' : ''}`}
            onClick={() => void onToggle(key)}
          >
            <span className="reaction-bar__emoji" aria-hidden>{emoji}</span>
            <span className="reaction-bar__count">{list.length}</span>
          </button>
        )
      })}
      {!canToggle && (
        <span className="reaction-bar__hint">Inicia sesión para reaccionar.</span>
      )}
    </div>
  )
}
