import { BookOpen } from 'lucide-react'
import { BOOK_SOURCE_FULL_CITATION, bookSourceRightsNotice } from '../../shared/bookSourceAttribution.js'

export default function CreditsAckModal({ onAcknowledge }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-zinc-950/55 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="credits-ack-title">
      <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl max-w-lg w-full max-h-[min(90vh,720px)] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6 md:p-7 border-b border-zinc-100 flex gap-3 shrink-0">
          <div className="shrink-0 w-11 h-11 rounded-2xl bg-amber-100/90 flex items-center justify-center text-amber-900 ring-1 ring-amber-200/50">
            <BookOpen className="w-6 h-6" aria-hidden />
          </div>
          <div>
            <h2 id="credits-ack-title" className="text-xl font-black text-zinc-900 leading-tight">
              Reconocimiento a la obra de referencia
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">Antes de continuar, lee y acepta esta información sobre los derechos de autor.</p>
          </div>
        </div>
        <div className="p-6 md:px-7 py-4 overflow-y-auto text-sm text-zinc-800 leading-relaxed space-y-4">
          <p>
            Contenido educativo basado y adaptado, con atribución explícita, de la publicación:{' '}
            <span className="font-semibold text-zinc-900">{BOOK_SOURCE_FULL_CITATION}</span>
          </p>
          <p className="text-zinc-600 text-xs leading-relaxed border-t border-dashed border-zinc-200 pt-3">
            {bookSourceRightsNotice}
          </p>
        </div>
        <div className="p-4 md:px-7 md:pb-6 border-t border-zinc-100">
          <button
            type="button"
            onClick={onAcknowledge}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white font-black text-sm shadow-md hover:from-blue-950 hover:to-blue-900"
          >
            He leído el reconocimiento y continúo
          </button>
        </div>
      </div>
    </div>
  )
}
