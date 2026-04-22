import { useMemo } from 'react'
import { legalNoticeHtmlFromTenant, legalNoticeMdClass } from './legalNoticeRender.js'

export default function LegalNoticeView() {
  const safe = useMemo(() => legalNoticeHtmlFromTenant(), [])

  return (
    <div className="space-y-6 animate-in fade-in max-w-3xl mx-auto">
      <article className="bg-white/95 border border-zinc-200/80 rounded-2xl p-5 sm:p-8 shadow-sm">
        <div className={legalNoticeMdClass} dangerouslySetInnerHTML={{ __html: safe }} />
      </article>
    </div>
  )
}
