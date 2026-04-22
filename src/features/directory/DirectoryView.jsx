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

const cardShell = 'w-full max-w-xl mx-auto bg-white/95 rounded-[2rem] shadow-xl shadow-blue-100/40 border border-blue-100/50 overflow-hidden'

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
  const isGuestUser = isGuest(currentUser)
  const canModerate = isAdminLike(currentUser)

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
    <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-black text-zinc-900">Directorio de Pesca</h2>
        <p className="text-zinc-500 mt-1 leading-relaxed">
          Tiendas, guías, hospedaje, botes y más. Filtra por tipo de servicio o busca por nombre, municipio o palabras clave. Los datos son aportados por la comunidad; verifica siempre antes de contratar.
        </p>
      </div>

      <div className="rounded-2xl border border-blue-100/80 bg-white/80 p-4 md:p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-black text-zinc-800">
          <Filter className="w-4 h-4 text-blue-600 shrink-0" />
          Filtros
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, municipio, río, teléfono…"
          className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
        />
        <div className="flex flex-wrap gap-2">
          {FISHING_SERVICE_TYPES.map((t) => {
            const on = filterTypes.has(t.id)
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleFilterType(t.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  on ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-zinc-600 border-zinc-200 hover:border-blue-300'
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
              className="px-3 py-1.5 rounded-full text-xs font-bold border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
            >
              Limpiar tipos
            </button>
          )}
        </div>
        <p className="text-xs font-medium text-zinc-500">
          Mostrando <span className="font-black text-zinc-800">{filtered.length}</span> de {sorted.length} registros
          {filterTypes.size > 0 ? ' · coincide si ofrece alguno de los tipos marcados' : ''}
        </p>
      </div>

      {!isGuestUser && (
        <div className="flex flex-wrap gap-3">
          {!showForm ? (
            <button
              type="button"
              onClick={startNew}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20"
            >
              <Fish className="w-4 h-4" />
              Registrar servicio o lugar
            </button>
          ) : (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 font-bold text-sm text-zinc-700 hover:bg-zinc-50"
            >
              <X className="w-4 h-4" />
              Cerrar formulario
            </button>
          )}
        </div>
      )}

      {isGuestUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-900 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>Como visitante puedes consultar el directorio. Si quieres publicar una ficha, inicia sesión con una cuenta aprobada en el portal.</p>
        </div>
      )}

      {showForm && !isGuestUser && (
        <div className={cardShell}>
          <div className="bg-black px-6 py-5 text-center text-white">
            {BRAND_LOGO_SRC ? (
              <img src={BRAND_LOGO_SRC} alt="" className="h-12 w-auto max-w-[180px] object-contain mx-auto mb-2" />
            ) : (
              <Fish className="w-9 h-9 text-cyan-400 mx-auto mb-2" strokeWidth={1.5} />
            )}
            <p className="text-xs font-black tracking-[0.15em] uppercase text-blue-300">{TENANT.name}</p>
            <p className="text-sm font-bold mt-1">{editingId != null ? 'Editar ficha' : 'Nueva ficha en el directorio'}</p>
          </div>
          <form onSubmit={(e) => void handleSubmit(e)} className="p-6 md:p-8 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-zinc-700 mb-1">Nombre del proveedor o lugar</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  maxLength={120}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Municipio o zona</label>
                <input
                  value={form.municipality}
                  onChange={(e) => setForm((f) => ({ ...f, municipality: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  maxLength={120}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Lugar (río, embalse, barrio…)</label>
                <input
                  value={form.placeDetail}
                  onChange={(e) => setForm((f) => ({ ...f, placeDetail: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  maxLength={200}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Tipos de servicio (marca todos los que apliquen)</label>
              <div className="grid sm:grid-cols-2 gap-2">
                {FISHING_SERVICE_TYPES.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm font-medium text-zinc-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.serviceTypes.includes(t.id)}
                      onChange={() => toggleServiceType(t.id)}
                      className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Descripción del servicio</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-y min-h-[100px]"
                maxLength={2000}
              />
              <p className="text-[11px] text-zinc-400 mt-1 font-medium">{form.description.length} / 2000</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Teléfono / WhatsApp</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Correo (opcional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Web o redes sociales</label>
              <input
                value={form.webSocial}
                onChange={(e) => setForm((f) => ({ ...f, webSocial: e.target.value }))}
                placeholder="https://… o @usuario"
                className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                maxLength={500}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Fecha de la ficha</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full sm:w-auto p-3 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white p-4 rounded-xl font-black hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {saving ? 'Guardando…' : editingId != null ? 'Guardar cambios' : 'Publicar ficha'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-black text-zinc-800">Listado</h3>
        {filtered.length === 0 ? (
          <p className="text-zinc-500 text-sm font-medium">No hay resultados con estos filtros.</p>
        ) : (
          <ul className="space-y-4">
            {filtered.map((e) => (
              <li
                key={e.id}
                className={`${cardShell} p-5 md:p-6 text-left border-l-[6px] border-l-blue-900 shadow-blue-950/5`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center rounded-full bg-blue-900 text-white text-[10px] font-black uppercase tracking-wide px-2.5 py-1 mb-2">
                      {TENANT.directoryCardBadge}
                    </span>
                    <h4 className="text-lg font-black text-zinc-900 leading-tight">{e.name}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(e.serviceTypes || []).map((tid) => (
                        <span
                          key={tid}
                          className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-100"
                        >
                          {serviceTypeLabel(tid)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!isGuestUser && canEditEntry(e) && (
                      <button
                        type="button"
                        onClick={() => startEdit(e)}
                        className="p-2 rounded-lg text-blue-700 hover:bg-blue-50 border border-blue-100"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {!isGuestUser && canDeleteEntry(e) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(e)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-100"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-zinc-600 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-green-700 shrink-0" />
                    {e.municipality}
                    {e.placeDetail && e.placeDetail !== '—' ? ` · ${e.placeDetail}` : ''}
                  </span>
                </p>
                <p className="text-sm text-zinc-700 mt-3 whitespace-pre-wrap leading-relaxed">{e.description}</p>
                <div className="mt-4 flex flex-col gap-1.5 text-sm">
                  {e.phone ? (
                    <a href={`tel:${String(e.phone).replace(/\s/g, '')}`} className="inline-flex items-center gap-2 font-bold text-blue-700 hover:underline">
                      <Phone className="w-4 h-4 shrink-0" />
                      {e.phone}
                    </a>
                  ) : null}
                  {e.email ? (
                    <a href={`mailto:${e.email}`} className="inline-flex items-center gap-2 font-bold text-blue-700 hover:underline break-all">
                      <Mail className="w-4 h-4 shrink-0" />
                      {e.email}
                    </a>
                  ) : null}
                  {e.webSocial ? (
                    <span className="inline-flex items-start gap-2 font-medium text-zinc-700 break-all">
                      <Globe className="w-4 h-4 shrink-0 mt-0.5" />
                      {e.webSocial}
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] font-bold text-zinc-400 mt-4">
                  Ficha · {displayPortalDate(parseToIsoDate(e.date))}
                  {e.author ? ` · ${e.author}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
