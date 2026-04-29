import { createRoot } from 'react-dom/client'
import ReactionBar from './ReactionBar.jsx'

/**
 * Monta la barra de reacciones en un contenedor DOM (API no-React).
 * @returns {() => void} desmontar
 */
export function mountReactionBar(container, { db, appContext, contentType, contentId, userId, theme = 'light' }) {
  if (!container) throw new Error('mountReactionBar: container requerido')
  const root = createRoot(container)
  root.render(
    <ReactionBar
      key={`${String(appContext)}:${String(contentType)}:${String(contentId)}`}
      db={db}
      appContext={appContext}
      contentType={contentType}
      contentId={contentId}
      userId={userId}
      theme={theme}
    />,
  )
  return () => {
    root.unmount()
  }
}
