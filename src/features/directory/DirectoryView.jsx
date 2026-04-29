import { useMemo, useState } from 'react'
import {
  Fish,
  Loader2,
  Send,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Filter,
  Pencil,
  X,
  AlertCircle,
} from 'lucide-react'
import { isAdminLike, isGuest } from '../../shared/utils.js'
import { TENANT } from '../../tenant.config.js'
import { BRAND_LOGO_SRC } from '../../brandAssets.js'
import { FISHING_SERVICE_TYPES, serviceTypeLabel } from '../../shared/fishingServiceTypes.js'
import { compareDirectoryEntriesByNameAsc } from '../../firestore/portalDataShared.js'
import { todayIsoDate, parseToIsoDate, displayPortalDate } from '../../shared/portalDates.js'
import { findLocalDirectoryDuplicateWarnings } from '../../shared/directoryDuplicateLocal.js'
import { fetchGeminiDirectoryDuplicateCheck, isGeminiConfigured } from '../../geminiClient.js'
import { db as firestoreDb, useLocalPortalData } from '../../firebase.js'
import ReactionBar from '../../reactions/ReactionBar.jsx'
import { PORTAL_REACTION_APP_CONTEXT } from '../../shared/portalReactionsContext.js'

const listCardClass =
  'relative flex h-full min-w-0 flex-col rounded-2xl border border-zinc-200/90 bg-white p-4 sm:p-5 shadow-sm hover:border-zinc-300/80 transition-colors'

const emptyForm = () => ({
  name: '',
  municipality: '',
  placeDetail: '',
  description: '',
  phone: '',
  email: '',
  webSocial: '',
  serviceTypes: [],
  date: todayIsoDate(),
})

const entryToForm = (e) => ({
  name: e.name || '',
  municipality: e.municipality || '',
  placeDetail: e.placeDetail || '',
  description: e.description || '',
  phone: e.phone || '',
  email: e.email || '',
  webSocial: e.webSocial || '',
  serviceTypes: Array.isArray(e.serviceTypes) ? [...e.serviceTypes] : [],
  date: parseToIsoDate(e.date),
})

function simpleEmailOk(s) {
  const t = s.trim()
  if (!t) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

export default function DirectoryView({ currentUser, db, saveDirectoryEntry, deleteDirectoryEntry, logAction, showAlert, showConfirm }) {
  const [search, setSearch] = useState('')
  const [filterTypes, setFilterTypes] = useState(() => new Set())
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [dupCheckBusy, setDupCheckBusy] = useState(false)
  const isGuestUser = isGuest(currentUser)
  const canModerate = isAdminLike(currentUser)
  const reactionUserId = isGuestUser ? null : currentUser.username
  const showReactions = !useLocalPortalData && firestoreDb

  const sorted = useMemo(
    () => [...(db.directoryEntries || [])].sort(compareDirectoryEntriesByNameAsc),
    [db.directoryEntries],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sorted.filter((e) => {
      if (filterTypes.size > 0) {
        const types = Array.isArray(e.serviceTypes) ? e.serviceTypes : []
        const any = [...filterTypes].some((id) => types.includes(id))
        if (!any) return false
      }
      if (!q) return true
      const blob = [e.name, e.municipality, e.placeDetail, e.description, e.phone, e.email, e.webSocial]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [sorted, search, filterTypes])

  const toggleFilterType = (id) => {
    setFilterTypes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm())
  }

  const startNew = () => {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const startEdit = (e) => {
    setEditingId(e.id)
    setForm(entryToForm(e))
    setShowForm(true)
  }

  const toggleServiceType = (id) => {
    setForm((f) => {
      const has = f.serviceTypes.includes(id)
      return {
        ...f,
        serviceTypes: has ? f.serviceTypes.filter((x) => x !== id) : [...f.serviceTypes, id],
      }
    })
  }

  const persistDirectoryEntry = async (name, municipality, placeDetail, description, phone, email, webSocial) => {
    setSaving(true)
    try {
      const isEdit = editingId != null
      const prev = isEdit ? sorted.find((r) => String(r.id) === String(editingId)) : null
      const id = isEdit ? editingId : Date.now()
      const next = {
        ...(prev || {}),
        id,
        name,
        municipality: municipality || '—',
        placeDetail: placeDetail || '—',
        description,
        phone,
        email,
        webSocial,
        serviceTypes: form.serviceTypes,
        date: form.date,
        author: prev?.author ?? currentUser.name,
        authorUsername: prev?.authorUsername ?? currentUser.username,
      }
      await saveDirectoryEntry(next)
      logAction?.(isEdit ? 'EDITAR_DIRECTORIO_PESCA' : 'NUEVO_DIRECTORIO_PESCA', name.slice(0, 80))
      resetForm()
      showAlert(isEdit ? 'Ficha actualizada.' : 'Gracias: tu servicio ya está en el directorio.')
    } catch {
      showAlert('No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const name = form.name.trim()
    const municipality = form.municipality.trim()
    const placeDetail = form.placeDetail.trim()
    const description = form.description.trim()
    const phone = form.phone.trim()
    const email = form.email.trim()
    const webSocial = form.webSocial.trim()
    if (name.length < 2) return showAlert('El nombre debe tener al menos 2 caracteres.')
    if (name.length > 120) return showAlert('El nombre es demasiado largo (máx. 120).')
    if (municipality.length > 120) return showAlert('Municipio o zona: máximo 120 caracteres.')
    if (placeDetail.length > 200) return showAlert('Lugar (río, embalse…): máximo 200 caracteres.')
    if (description.length < 10) return showAlert('La descripción debe tener al menos 10 caracteres.')
    if (description.length > 2000) return showAlert('La descripción supera el límite (máx. 2000).')
    if (phone && phone.replace(/\D/g, '').length < 7) return showAlert('El teléfono no parece válido.')
    if (!simpleEmailOk(email)) return showAlert('El correo electrónico no es válido.')
    if (webSocial.length > 500) return showAlert('Web o redes: máximo 500 caracteres.')
    if (form.serviceTypes.length === 0) return showAlert('Selecciona al menos un tipo de servicio.')

    const candidate = { name, phone, email, webSocial }
    const excludeId = editingId
    const others = sorted.filter((e) => (excludeId == null ? true : String(e.id) !== String(excludeId)))

    const localWarnings = findLocalDirectoryDuplicateWarnings(candidate, others, excludeId)
    const warnings = [...localWarnings]

    if (isGeminiConfigured() && others.length > 0) {
      setDupCheckBusy(true)
      try {
        const ai = await fetchGeminiDirectoryDuplicateCheck(
          {
            name,
            phone,
            email,
            webSocial,
            municipality,
            description,
          },
          others.map((e) => ({
            name: e.name,
            phone: e.phone,
            email: e.email,
            webSocial: e.webSocial,
            municipality: e.municipality,
          })),
        )
        if (ai?.hasDuplicateRisk) {
          const names = (ai.matchingNames || []).filter(Boolean)
          const tail = names.length ? ` Fichas señaladas: ${names.join(', ')}.` : ''
          warnings.push(`• Revisión IA: ${(ai.reason || 'Posible duplicado con una entrada existente.')}${tail}`)
        }
      } catch {
        /* no bloquear guardado si la IA falla */
      } finally {
        setDupCheckBusy(false)
      }
    }

    const runSave = () => void persistDirectoryEntry(name, municipality, placeDetail, description, phone, email, webSocial)

    if (warnings.length > 0) {
      showConfirm(
        `Se detectaron posibles duplicados en el directorio:\n\n${warnings.join('\n')}\n\n¿Deseas guardar la ficha de todas formas?`,
        runSave,
      )
      return
    }
    runSave()
  }

  const handleDelete = (e) => {
    showConfirm(`¿Eliminar del directorio a «${e.name}»?`, async () => {
      try {
        await deleteDirectoryEntry(e.id)
        logAction?.('ELIMINAR_DIRECTORIO_PESCA', String(e.name).slice(0, 80))
        if (editingId != null && String(editingId) === String(e.id)) resetForm()
        showAlert('Registro eliminado.')
      } catch {
        showAlert('No se pudo eliminar.')
      }
    })
  }

  const canEditEntry = (e) => {
    if (canModerate) return true
    return e.authorUsername && e.authorUsername === currentUser.username
  }

  const canDeleteEntry = (e) => {
    if (canModerate) return true
    return e.authorUsername && e.authorUsername === currentUser.username
  }

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto pb-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Directorio de Pesca</h2>
          <p className="text-zinc-600 mt-2 text-sm md:text-base leading-relaxed max-w-2xl">
            Tiendas, guías, hospedaje, botes y más. Busca o filtra por tipo de servicio. Los datos los aporta la comunidad: conviene confirmar antes de contratar.
          </p>
        </div>
        {!isGuestUser && (
          <div className="shrink-0">
            {!showForm ? (
              <button
                type="button"
                onClick={startNew}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 shadow-md shadow-blue-900/10"
              >
                <Fish className="w-4 h-4 shrink-0" />
                Registrar servicio o lugar
              </button>
            ) : (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-300 bg-white font-bold text-sm text-zinc-800 hover:bg-zinc-50"
              >
                <X className="w-4 h-4 shrink-0" />
                Cerrar formulario
              </button>
            )}
          </div>
        )}
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-black text-zinc-800">
            <Filter className="w-4 h-4 text-blue-600 shrink-0" aria-hidden />
            Buscar y filtrar
          </div>
          <p className="text-xs font-semibold text-zinc-500 tabular-nums">
            <span className="font-black text-zinc-800">{filtered.length}</span>
            <span className="text-zinc-400"> / </span>
            {sorted.length}
          </p>
        </div>
        <div className="relative">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre, municipio, río, teléfono…"
            className="w-full pl-4 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/80 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 font-medium text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {FISHING_SERVICE_TYPES.map((t) => {
            const on = filterTypes.has(t.id)
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleFilterType(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  on ? 'bg-blue-600 text-white border-blue-600' : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {t.label}
              </button>
            )
          })}
          {filterTypes.size > 0 && (
            <button
              type="button"
              onClick={() => setFilterTypes(new Set())}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {isGuestUser && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 flex gap-3 text-amber-950 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-700" aria-hidden />
          <p className="font-medium leading-snug">Como visitante solo puedes consultar. Para publicar una ficha, inicia sesión con una cuenta aprobada.</p>
        </div>
      )}

      {showForm && !isGuestUser && (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-md overflow-hidden">
          <div className="flex flex-wrap items-center gap-4 px-5 py-4 border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white">
            {BRAND_LOGO_SRC ? (
              <img src={BRAND_LOGO_SRC} alt="" className="h-10 w-auto max-w-[140px] object-contain shrink-0" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shrink-0">
                <Fish className="w-5 h-5" strokeWidth={2} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-black text-zinc-900 leading-tight">
                {editingId != null ? 'Editar ficha' : 'Nueva ficha en el directorio'}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5 font-medium">{TENANT.name}</p>
            </div>
          </div>
          <form onSubmit={(e) => void handleSubmit(e)} className="p-5 md:p-8 space-y-8">
            <fieldset className="space-y-4 min-w-0">
              <legend className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-3 block">Servicio</legend>
              <div>
                <label className="block text-sm font-bold text-zinc-800 mb-1.5">Nombre del proveedor o lugar</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 font-medium text-zinc-900"
                  maxLength={120}
                  placeholder="Ej. Guías Orinoquía"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-800 mb-2">Qué ofrece (elige uno o varios)</label>
                <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4">
                  {FISHING_SERVICE_TYPES.map((t) => (
                    <label key={t.id} className="flex items-start gap-2.5 text-sm font-medium text-zinc-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.serviceTypes.includes(t.id)}
                        onChange={() => toggleServiceType(t.id)}
                        className="mt-0.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-800 mb-1.5">Descripción del servicio</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 font-medium resize-y min-h-[108px] text-zinc-900"
                  maxLength={2000}
                  placeholder="Qué incluye, experiencia, zonas donde operan…"
                />
                <p className="text-[11px] text-zinc-400 mt-1.5 font-medium tabular-nums">{form.description.length} / 2000</p>
              </div>
            </fieldset>

            <fieldset className="space-y-4 min-w-0">
              <legend className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-3 block">Ubicación</legend>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-1.5">Municipio o zona</label>
                  <input
                    value={form.municipality}
                    onChange={(e) => setForm((f) => ({ ...f, municipality: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 font-medium"
                    maxLength={120}
                    placeholder="Ej. Puerto Gaitán"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-1.5">Lugar (río, embalse, barrio…)</label>
                  <input
                    value={form.placeDetail}
                    onChange={(e) => setForm((f) => ({ ...f, placeDetail: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 font-medium"
                    maxLength={200}
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4 min-w-0">
              <legend className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-3 block">Contacto</legend>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-1.5">Teléfono / WhatsApp</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 font-medium"
                    placeholder="+57…"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-1.5">Correo <span className="font-normal text-zinc-500">(opcional)</span></label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 font-medium"
                    placeholder="contacto@…"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-800 mb-1.5">Web o redes sociales</label>
                <input
                  value={form.webSocial}
                  onChange={(e) => setForm((f) => ({ ...f, webSocial: e.target.value }))}
                  placeholder="https://… o @usuario"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 font-medium"
                  maxLength={500}
                />
              </div>
              <div className="max-w-xs">
                <label className="block text-sm font-bold text-zinc-800 mb-1.5">Fecha de la ficha</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 font-medium"
                />
              </div>
            </fieldset>

            <div className="pt-2 border-t border-zinc-100">
              <button
                type="submit"
                disabled={saving || dupCheckBusy}
                className="w-full sm:w-auto min-w-[200px] bg-blue-600 text-white px-8 py-3.5 rounded-xl font-black text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
              >
                {dupCheckBusy || saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {dupCheckBusy ? 'Comprobando…' : saving ? 'Guardando…' : editingId != null ? 'Guardar cambios' : 'Publicar ficha'}
              </button>
            </div>
          </form>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-black text-zinc-900">Directorio</h3>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">{filtered.length} resultado{filtered.length === 1 ? '' : 's'}</span>
        </div>
        {filtered.length === 0 ? (
          <p className="text-zinc-500 text-sm font-medium rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-8 text-center">
            No hay fichas con estos criterios. Prueba otra búsqueda o quita algunos filtros.
          </p>
        ) : (
          <ul
            className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2"
            role="list"
          >
            {filtered.map((e) => (
              <li key={e.id} className={`${listCardClass} border-l-4 border-l-blue-600`}>
                {(!isGuestUser && (canEditEntry(e) || canDeleteEntry(e))) ? (
                  <div className="absolute right-2 top-3 z-10 flex gap-0.5 sm:right-3 sm:top-4">
                    {canEditEntry(e) && (
                      <button
                        type="button"
                        onClick={() => startEdit(e)}
                        className="rounded-lg border border-blue-100 bg-white/95 p-1.5 text-blue-700 shadow-sm hover:bg-blue-50 sm:p-2"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {canDeleteEntry(e) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(e)}
                        className="rounded-lg border border-red-100 bg-white/95 p-1.5 text-red-600 shadow-sm hover:bg-red-50 sm:p-2"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : null}
                <div className="min-w-0 pr-12 sm:pr-14">
                  <span className="mb-1.5 inline-flex items-center rounded-md border border-zinc-200/80 bg-zinc-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-zinc-600">
                    {TENANT.directoryCardBadge}
                  </span>
                  <h4 className="text-base font-black leading-snug text-zinc-900 sm:text-lg">{e.name}</h4>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(e.serviceTypes || []).map((tid) => (
                      <span
                        key={tid}
                        className="rounded-full border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-blue-800 sm:text-[10px] sm:px-2"
                      >
                        {serviceTypeLabel(tid)}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-xs font-bold leading-snug text-zinc-600 sm:text-sm">
                  <span className="inline-flex min-w-0 items-start gap-1">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-700" />
                    <span className="min-w-0 break-words">
                      {e.municipality}
                      {e.placeDetail && e.placeDetail !== '—' ? ` · ${e.placeDetail}` : ''}
                    </span>
                  </span>
                </p>
                <p className="mt-2 min-h-0 flex-1 text-sm leading-relaxed text-zinc-700 sm:line-clamp-6">
                  {e.description}
                </p>
                <div className="mt-3 flex flex-col gap-1.5 text-xs sm:text-sm">
                  {e.phone ? (
                    <a
                      href={`tel:${String(e.phone).replace(/\s/g, '')}`}
                      className="inline-flex min-w-0 items-center gap-1.5 font-bold text-blue-700 hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                      <span className="truncate">{e.phone}</span>
                    </a>
                  ) : null}
                  {e.email ? (
                    <a
                      href={`mailto:${e.email}`}
                      className="inline-flex min-w-0 items-center gap-1.5 break-all font-bold text-blue-700 hover:underline"
                    >
                      <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                      <span className="line-clamp-2 break-all">{e.email}</span>
                    </a>
                  ) : null}
                  {e.webSocial ? (
                    <span className="inline-flex min-w-0 items-start gap-1.5 font-medium text-zinc-700">
                      <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                      <span className="line-clamp-2 break-all text-[11px] sm:text-sm">{e.webSocial}</span>
                    </span>
                  ) : null}
                </div>
                {showReactions ? (
                  <ReactionBar
                    db={firestoreDb}
                    appContext={PORTAL_REACTION_APP_CONTEXT}
                    contentType="directoryEntries"
                    contentId={e.id}
                    userId={reactionUserId}
                    className="mt-3 border-t border-zinc-100 pt-3"
                  />
                ) : null}
                <p className="mt-auto border-t border-zinc-100 pt-2.5 text-[10px] font-bold text-zinc-400 sm:text-[11px]">
                  Ficha · {displayPortalDate(parseToIsoDate(e.date))}
                  {e.author ? ` · ${e.author}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
