import { useEffect, useMemo } from 'react'
import { Scale, X } from 'lucide-react'
import { legalNoticeHtmlFromTenant, legalNoticeMdClass } from './legalNoticeRender.js'

export default function LegalNoticeModal({ open, onClose }) {
  const safe = useMemo(() => legalNoticeHtmlFromTenant(), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[250] flex items-stretch sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="legal-modal-title">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/55 backdrop-blur-sm border-0 w-full p-0 cursor-default"
        aria-label="Cerrar aviso legal"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-3xl max-h-[100dvh] sm:max-h-[min(90vh,820px)] flex flex-col bg-white sm:rounded-3xl border-0 sm:border border-zinc-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center gap-3 p-4 sm:p-5 border-b border-amber-100 bg-gradient-to-r from-amber-50/90 to-white">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-900 ring-1 ring-amber-200/60 shrink-0">
            <Scale className="w-6 h-6" aria-hidden />
          </div>
          <h2 id="legal-modal-title" className="text-lg sm:text-xl font-black text-zinc-900 pr-10">
            Aviso legal – comunidad informal
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 p-2 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-8 py-5 sm:py-6">
          <div className={legalNoticeMdClass} dangerouslySetInnerHTML={{ __html: safe }} />
        </div>
      </div>
    </div>
  )
}
