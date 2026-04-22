import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { PESCA_COLOMBIA_CHAPTERS } from '../../data/pescaColombiaChapters.js'
import { BOOK_SOURCE_FULL_CITATION, SOURCE_CREDITS_ACK_STORAGE_KEY, bookSourceRightsNotice } from '../../shared/bookSourceAttribution.js'
import { trackPortalEvent } from '../../analytics.js'
import CreditsAckModal from '../portal/CreditsAckModal.jsx'

marked.setOptions({ gfm: true, breaks: true })

const mdToSafeHtml = (md) => {
  const rawHtml = marked.parse(String(md || ''))
  return DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } })
}

const bodyClassName =
  'pesca-md max-w-none text-zinc-800 leading-relaxed ' +
  '[&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-zinc-900 [&_h1]:mt-2 [&_h1]:mb-4 ' +
  '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-zinc-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:scroll-mt-24 ' +
  '[&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-zinc-800 [&_h3]:mt-6 [&_h3]:mb-2 ' +
  '[&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 ' +
  '[&_li]:mb-1.5 [&_blockquote]:border-l-4 [&_blockquote]:border-amber-400/80 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-600 ' +
  '[&_a]:text-blue-800 [&_a]:underline [&_a]:font-semibold hover:[&_a]:text-blue-950 ' +
  '[&_table]:w-full [&_table]:text-sm [&_table]:border [&_table]:border-zinc-200 [&_table]:rounded-lg [&_table]:overflow-hidden ' +
  '[&_th]:bg-zinc-100 [&_th]:p-2 [&_th]:text-left [&_th]:font-bold [&_td]:p-2 [&_tr]:border-t [&_tr]:border-zinc-100 ' +
  '[&_code]:text-sm [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded ' +
  '[&_hr]:my-8 [&_hr]:border-zinc-200'

export default function PescaColombiaView({ onOpenSpeciesCatalog, userRole }) {
  const chapters = PESCA_COLOMBIA_CHAPTERS
  const [index, setIndex] = useState(0)
  const [creditsOpen, setCreditsOpen] = useState(false)
  const articleRef = useRef(null)

  useEffect(() => {
    try {
      if (typeof localStorage === 'undefined' || !localStorage.getItem(SOURCE_CREDITS_ACK_STORAGE_KEY)) {
        setCreditsOpen(true)
      }
    } catch {
      setCreditsOpen(true)
    }
  }, [])

  const safe = useMemo(
    () => (chapters[index] ? mdToSafeHtml(chapters[index].body) : '<p class="text-zinc-500">No hay capítulos cargados.</p>'),
    [chapters, index],
  )

  useEffect(() => {
    const root = articleRef.current
    if (!root) return
    const handler = (e) => {
      const a = e.target.closest('a')
      if (!a || !root.contains(a)) return
      const href = (a.getAttribute('href') || '').trim()
      if (!href) return

      if (href === '#species' || href === '#portal-species') {
        e.preventDefault()
        onOpenSpeciesCatalog?.()
        return
      }
      if (href === '#pesca-cap-catalogo-estructura') {
        e.preventDefault()
        const idx = chapters.findIndex((c) => c.id === 'catalogo-estructura')
        if (idx >= 0) setIndex(idx)
        return
      }
      if (href === '/catalogo-estructura' || href.startsWith('/especies')) {
        e.preventDefault()
        onOpenSpeciesCatalog?.()
      }
    }
    root.addEventListener('click', handler)
    return () => root.removeEventListener('click', handler)
  }, [chapters, onOpenSpeciesCatalog, safe])

  if (!chapters.length) {
    return (
      <div className="animate-in fade-in text-center py-20 text-zinc-500 font-medium">No se encontraron capítulos (01–07) en el contenido.</div>
    )
  }

  const ch = chapters[index]
  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
      {creditsOpen && (
        <CreditsAckModal
          onAcknowledge={() => {
            try {
              localStorage.setItem(SOURCE_CREDITS_ACK_STORAGE_KEY, '1')
            } catch {
              /* no localStorage */
            }
            setCreditsOpen(false)
            void trackPortalEvent('portal_source_credits_ack', { role: userRole || 'unknown' })
          }}
        />
      )}

      <header>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-900/10 text-blue-900 ring-1 ring-blue-200/50 mb-3">
          <BookOpen className="w-6 h-6" aria-hidden />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 tracking-tight">La pesca deportiva en Colombia</h2>
        <p className="text-zinc-500 mt-1.5 text-sm max-w-3xl leading-relaxed">
          Secciones generales basadas en la guía de referencia; navega por capítulos. Toda la información mantiene la atribución a los autores
          e instituciones creadoras.
        </p>
        <div className="mt-4 rounded-2xl border border-blue-200/60 bg-gradient-to-b from-white to-blue-50/30 p-4 text-sm text-zinc-700 shadow-sm">
          <p className="font-bold text-blue-950">Reconocimiento a la obra de referencia</p>
          <p className="mt-2 text-zinc-800 leading-relaxed">
            {BOOK_SOURCE_FULL_CITATION}
          </p>
          <p className="mt-3 text-zinc-600 text-xs leading-relaxed border-t border-zinc-100 pt-3">{bookSourceRightsNotice}</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-6 min-h-0">
        <nav
          className="md:w-64 shrink-0 space-y-1.5"
          aria-label="Capítulos de la guía"
        >
          {chapters.map((c, i) => {
            const active = i === index
            const capNum = c.orden
              || (() => {
                const m = c.filename && /^(\d{2})-/.exec(c.filename)
                return m ? Number(m[1]) : i + 1
              })()
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setIndex(i)
                }}
                className={`w-full text-left rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                  active
                    ? 'bg-blue-900 text-white shadow-md'
                    : 'bg-white/80 text-zinc-800 border border-zinc-200/80 hover:border-blue-300/80'
                }`}
              >
                <span className="text-[11px] opacity-80 block font-black uppercase tracking-tight">Cap. {String(capNum).padStart(2, '0')}</span>
                <span className="line-clamp-2">{c.titulo}</span>
              </button>
            )
          })}
        </nav>

        <article ref={articleRef} className="flex-1 min-w-0 bg-white/90 border border-zinc-200/80 rounded-2xl p-5 md:p-8 shadow-sm">
          <h3 className="text-lg font-black text-zinc-900 mb-4 border-b border-zinc-100 pb-3">{ch.titulo}</h3>
          <div className={bodyClassName} dangerouslySetInnerHTML={{ __html: safe }} />
        </article>
      </div>
    </div>
  )
}
