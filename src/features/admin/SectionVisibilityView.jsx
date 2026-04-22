import { useMemo, useState } from 'react'
import { Eye, EyeOff, Layers, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import {
  mergeSectionVisibility,
  mergeSectionOrder,
  PORTAL_CONTENT_SECTION_IDS,
  PORTAL_SECTION_LABELS,
} from '../../shared/portalSectionConfig.js'

export default function SectionVisibilityView({ db, updatePortalSectionSettings, logAction, showAlert }) {
  const merged = useMemo(() => mergeSectionVisibility(db.settings?.sections), [db.settings?.sections])
  const orderedIds = useMemo(() => mergeSectionOrder(db.settings?.sectionOrder), [db.settings?.sectionOrder])
  const [busyId, setBusyId] = useState(null)

  const toggle = async (id) => {
    const next = { ...merged, [id]: !merged[id] }
    const enabledCount = PORTAL_CONTENT_SECTION_IDS.filter((k) => next[k]).length
    if (enabledCount === 0) {
      showAlert?.('Debe quedar al menos una sección visible en el portal.')
      return
    }
    setBusyId(id)
    try {
      await updatePortalSectionSettings({ sections: next })
      logAction?.('PORTAL_SECCION_VISIBILIDAD', `${id}=${next[id] ? 'on' : 'off'}`)
    } catch {
      showAlert?.('No se pudo guardar la configuración.')
    } finally {
      setBusyId(null)
    }
  }

  const move = async (id, delta) => {
    const idx = orderedIds.indexOf(id)
    const j = idx + delta
    if (idx < 0 || j < 0 || j >= orderedIds.length) return
    const nextOrder = [...orderedIds]
    const tmp = nextOrder[idx]
    nextOrder[idx] = nextOrder[j]
    nextOrder[j] = tmp
    setBusyId(id)
    try {
      await updatePortalSectionSettings({ sectionOrder: nextOrder })
      logAction?.('PORTAL_SECCION_ORDEN', `${PORTAL_SECTION_LABELS[id] || id} · pos ${idx + 1}→${j + 1}`)
    } catch {
      showAlert?.('No se pudo guardar el orden.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-black text-zinc-900 flex items-center gap-2">
          <Layers className="w-8 h-8 text-blue-700 shrink-0" />
          Secciones del portal
        </h2>
        <p className="text-zinc-500 mt-1 max-w-2xl">
          Define el <span className="font-bold text-zinc-700">orden del menú</span> y si cada sección está visible. Lo que desactives no aparece en la
          navegación para nadie (incluidos administradores). Solo el superadmin ve esta pantalla.
        </p>
      </div>

      <ul className="rounded-2xl border border-blue-100/80 bg-white/90 divide-y divide-zinc-100 shadow-sm max-w-xl">
        {orderedIds.map((id, index) => {
          const on = merged[id] !== false
          const busy = busyId === id
          return (
            <li key={id} className="flex items-center gap-2 sm:gap-3 p-3 md:px-4">
              <div className="flex flex-col shrink-0 gap-0.5">
                <button
                  type="button"
                  disabled={busy || index === 0}
                  onClick={() => void move(id, -1)}
                  className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Subir en el menú"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={busy || index === orderedIds.length - 1}
                  onClick={() => void move(id, 1)}
                  className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Bajar en el menú"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-900">{PORTAL_SECTION_LABELS[id] || id}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {on ? 'Visible en el menú' : 'Oculta para todos'} · Orden {index + 1}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void toggle(id)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-colors disabled:opacity-60 ${
                  on
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                }`}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : on ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {on ? 'Activa' : 'Inactiva'}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
