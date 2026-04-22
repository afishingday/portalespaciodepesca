import { useCallback, useEffect, useMemo, useState } from 'react'
import { Fish, X, ChevronRight, Search } from 'lucide-react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { SPECIES_CATALOG } from '../../initialData.js'

marked.setOptions({ gfm: true, breaks: true })

const detailMdClass =
  'species-md max-w-none text-zinc-800 leading-relaxed ' +
  '[&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-zinc-900 [&_h1]:mt-0 [&_h1]:mb-4 ' +
  '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-zinc-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:scroll-mt-4 ' +
  '[&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-zinc-800 [&_h3]:mt-5 [&_h3]:mb-2 ' +
  '[&_h4]:text-base [&_h4]:font-bold [&_h4]:text-zinc-800 [&_h4]:mt-4 ' +
  '[&_p]:mb-3 [&_p]:text-[15px] ' +
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 ' +
  '[&_li]:mb-1.5 [&_strong]:text-zinc-900 ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-amber-400/80 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-600 ' +
  '[&_a]:text-blue-800 [&_a]:underline [&_a]:font-semibold hover:[&_a]:text-blue-950 ' +
  '[&_table]:w-full [&_table]:text-sm [&_table]:border [&_table]:border-zinc-200 [&_table]:rounded-lg [&_table]:my-4 ' +
  '[&_th]:bg-zinc-100 [&_th]:p-2 [&_th]:text-left [&_th]:font-bold [&_td]:p-2 [&_tr]:border-t [&_tr]:border-zinc-100 ' +
  '[&_code]:text-sm [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded ' +
  '[&_hr]:my-6 [&_hr]:border-zinc-200'

function renderMarkdownToHtml(md) {
  const raw = marked.parse(String(md || ''))
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
}

function normalizeForSearch(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
}

function speciesMatchesQuery(sp, qNorm) {
  if (!qNorm) return true
  const hay = normalizeForSearch(
    [sp.name, sp.scientific, sp.family, sp.slug, sp.description].filter(Boolean).join(' · '),
  )
  const words = qNorm.split(/\s+/).filter(Boolean)
  return words.every((w) => hay.includes(w))
}

function SpeciesDetailModal({ species, onClose }) {
  const safeHtml = useMemo(() => renderMarkdownToHtml(species?.bodyMarkdown), [species?.bodyMarkdown])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  if (!species) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-stretch sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="species-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm border-0 w-full p-0 cursor-default"
        aria-label="Cerrar ficha"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-5xl max-h-[100dvh] sm:max-h-[min(92vh,880px)] flex flex-col bg-white sm:rounded-3xl border-0 sm:border border-zinc-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-start gap-3 p-4 sm:p-5 border-b border-zinc-100 bg-gradient-to-b from-white to-zinc-50/80">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shrink-0">
            <Fish className="w-6 h-6 text-blue-500" aria-hidden />
          </div>
          <div className="flex-1 min-w-0 pr-10">
            <h2 id="species-modal-title" className="text-xl sm:text-2xl font-black text-zinc-900 leading-tight">
              {species.name}
            </h2>
            <p className="text-sm font-bold text-blue-600 italic mt-0.5">{species.scientific}</p>
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mt-1">{species.family}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 p-2 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-8 py-5 sm:py-6">
          <div className={detailMdClass} dangerouslySetInnerHTML={{ __html: safeHtml }} />
        </div>
      </div>
    </div>
  )
}

const SpeciesView = () => {
  const [openKey, setOpenKey] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const totalCount = SPECIES_CATALOG.length

  const qNorm = useMemo(() => normalizeForSearch(searchQuery.trim()), [searchQuery])

  const filteredList = useMemo(
    () => SPECIES_CATALOG.filter((sp) => speciesMatchesQuery(sp, qNorm)),
    [qNorm],
  )

  const selected = useMemo(
    () => (openKey ? SPECIES_CATALOG.find((s) => (s.slug || s.name) === openKey) : null),
    [openKey],
  )

  const closeModal = useCallback(() => setOpenKey(null), [])

  return (
    <div className="space-y-6 animate-in fade-in">
      {selected && <SpeciesDetailModal species={selected} onClose={closeModal} />}

      <div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <h2 className="text-3xl font-black text-zinc-900">Catálogo de Especies</h2>
          <p className="text-sm font-bold text-zinc-500 shrink-0">
            <span className="text-zinc-900 tabular-nums">{totalCount}</span>{' '}
            {totalCount === 1 ? 'especie' : 'especies'} en total
          </p>
        </div>
        <p className="text-zinc-500 mt-1">Guía de las principales especies deportivas de Colombia.</p>
        <p className="text-[11px] text-zinc-400 mt-2 font-medium leading-relaxed max-w-3xl">
          Fichas adaptadas de Lasso et al. (2019). <span className="italic">La pesca deportiva continental en Colombia</span>. Instituto
          Humboldt / Fundación Orinoquía. Toca una tarjeta para abrir la ficha completa.
        </p>
      </div>

      <div className="max-w-xl">
        <label htmlFor="species-search" className="sr-only">
          Buscar especies
        </label>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" aria-hidden />
          <input
            id="species-search"
            type="search"
            autoComplete="off"
            placeholder="Buscar por nombre, científico, familia…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300"
          />
        </div>
        {qNorm ? (
          <p className="text-xs font-bold text-zinc-500 mt-2">
            Mostrando <span className="text-zinc-900 tabular-nums">{filteredList.length}</span> de{' '}
            <span className="tabular-nums">{totalCount}</span>
            {filteredList.length === 0 && ' · prueba con otro término'}
          </p>
        ) : null}
      </div>

      {filteredList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredList.map((sp) => {
            const key = sp.slug || sp.name
            return (
              <div key={key} className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                <button
                  type="button"
                  className="w-full p-6 text-left flex items-start gap-4 group hover:bg-blue-50/30 transition-colors"
                  onClick={() => setOpenKey(key)}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shrink-0">
                    <Fish className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-black text-zinc-900 group-hover:text-blue-700 transition-colors">{sp.name}</h3>
                      <span className="shrink-0 text-xs font-bold text-blue-700 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity max-sm:opacity-100">
                        Ficha
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                    <p className="text-xs font-bold text-blue-600 italic mt-0.5">{sp.scientific}</p>
                    <span className="inline-block text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full mt-1">
                      {sp.family}
                    </span>
                    <p className="text-sm text-zinc-600 mt-2 leading-relaxed line-clamp-3">{sp.description}</p>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      ) : qNorm ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-10 text-center">
          <p className="text-zinc-600 font-bold">No hay especies que coincidan con «{searchQuery.trim()}».</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-4 text-sm font-black text-blue-700 hover:text-blue-900 underline underline-offset-2"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default SpeciesView
