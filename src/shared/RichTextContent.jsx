import { useMemo } from 'react'
import { sanitizePortalHtml } from './sanitizePortalHtml.js'
import './richText.css'

export function RichTextContent({ html, className = '' }) {
  const safe = useMemo(() => sanitizePortalHtml(html || ''), [html])
  if (!safe) return null
  return (
    <div
      className={`portal-rich-html max-w-none ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
