import { useMemo, useState } from 'react'
import {
  PlusCircle, Trophy, User, Calendar, MapPin, Edit3, Trash2, Loader2, Fish, UploadCloud, Filter,
  Eye, EyeOff, ShieldAlert,
} from 'lucide-react'
import { isAdminLike, isGuest } from '../../shared/utils.js'
import {
  MAX_ENTITY_IMAGE_BYTES,
  MAX_ENTITY_IMAGE_SOURCE_BYTES,
  uploadEntityImageFile,
} from '../../firestore/uploadEntityImage.js'
import { ImageCropDialog } from '../../shared/ImageCropDialog.jsx'
import { RECORD_SPECIES_OPTIONS, defaultRecordSpeciesSelect } from '../../shared/fishingSpecies.js'
import { TENANT } from '../../tenant.config.js'
import { findPersonalBestRecord, parseRecordWeightToLb } from '../../shared/recordWeight.js'
import { isPublicOnClubWall, recordShownInRecordsGrid } from '../../shared/recordVisibility.js'

const emptyForm = () => ({
  species: defaultRecordSpeciesSelect(),
  weight: '',
  location: '',
  date: new Date().toISOString().split('T')[0], image: '', notes: '',
  clubVisible: true,
})

const RecordsView = ({ currentUser, db, saveRecord, deleteRecord, logAction, showAlert, showConfirm }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imageCropSource, setImageCropSource] = useState(null)
  const [filterSpecies, setFilterSpecies] = useState('')
  const [filterAngler, setFilterAngler] = useState('')
  const canManage = isAdminLike(currentUser)
  const isGuestUser = isGuest(currentUser)

  const recordsList = db.records || []

  const speciesFilterOptions = useMemo(() => {
    const catalog = RECORD_SPECIES_OPTIONS.filter((s) => s !== 'Otra')
    const canonicalByLower = new Map(
      catalog.map((s) => [s.toLocaleLowerCase('es'), s]),
    )
    const seen = new Set()
    const out = []
    for (const s of catalog) {
      const k = s.toLocaleLowerCase('es')
      if (seen.has(k)) continue
      seen.add(k)
      out.push(s)
    }
    for (const r of recordsList) {
      const raw = String(r?.species ?? '').trim()
      if (!raw) continue
      const k = raw.toLocaleLowerCase('es')
      if (seen.has(k)) continue
      seen.add(k)
      out.push(canonicalByLower.get(k) || raw)
    }
    return out.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
  }, [recordsList])

  const anglerFilterOptions = useMemo(() => {
    const m = new Map()
    for (const r of recordsList) {
      if (!r?.anglerUsername) continue
      if (!m.has(r.anglerUsername)) m.set(r.anglerUsername, r.angler || r.anglerUsername)
    }
    return [...m.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'es'))
  }, [recordsList])

  const visibilityFiltered = useMemo(
    () => recordsList.filter((r) => recordShownInRecordsGrid(r, currentUser, canManage)),
    [recordsList, currentUser, canManage],
  )

  const filteredRecords = useMemo(() => {
    let list = [...visibilityFiltered]
    if (filterSpecies) list = list.filter((r) => r.species === filterSpecies)
    if (filterAngler) list = list.filter((r) => r.anglerUsername === filterAngler)
    return list
  }, [visibilityFiltered, filterSpecies, filterAngler])

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm())
    setImageFile(null)
    setImageCropSource(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.weight || !form.location) return showAlert('Peso y lugar son obligatorios.')
    const newLb = parseFloat(String(form.weight).replace(',', '.'))
    if (!Number.isFinite(newLb) || newLb <= 0) return showAlert('Indica un peso válido en libras.')

    const isEditing = editingId != null

    const persistRecord = async (recordId, prevForMerge, logCode, successMsg) => {
      setSaving(true)
      try {
        const imageUrl = imageFile
          ? await uploadEntityImageFile(imageFile, 'records', recordId)
          : (form.image || prevForMerge?.image || null)
        const record = {
          ...(prevForMerge || {}),
          id: recordId,
          species: form.species,
          weight: `${form.weight} lb`,
          location: form.location,
          date: form.date,
          image: imageUrl,
          notes: form.notes || '',
          angler: prevForMerge?.angler ?? currentUser.name,
          anglerUsername: prevForMerge?.anglerUsername ?? currentUser.username,
          clubVisible: form.clubVisible === false ? false : true,
          adminSuppressed: prevForMerge?.adminSuppressed === true,
        }
        await saveRecord(record)
        logAction?.(logCode, `${record.species} - ${record.weight}`)
        resetForm()
        showAlert(successMsg)
      } catch (err) {
        if (err instanceof Error && err.message === 'ENTITY_IMAGE_TOO_LARGE') {
          showAlert(`No pudimos reducir la foto lo suficiente (límite de subida ${Math.round(MAX_ENTITY_IMAGE_BYTES / 1024)} KB). Prueba con otra imagen.`)
        } else if (err instanceof Error && err.message === 'ENTITY_IMAGE_DECODE_FAILED') {
          showAlert('No se pudo procesar la imagen. Prueba con JPG o PNG.')
        } else if (err instanceof Error && err.message === 'ENTITY_IMAGE_STORAGE_UNAVAILABLE') {
          showAlert('La subida de imágenes no está disponible: revisa la configuración de Firebase.')
        } else {
          showAlert('No se pudo guardar el récord.')
        }
      } finally {
        setSaving(false)
      }
    }

    if (isEditing) {
      const prev = recordsList.find((r) => String(r.id) === String(editingId))
      await persistRecord(editingId, prev, 'EDITAR_RECORD', 'Récord actualizado.')
      return
    }

    const personalBest = findPersonalBestRecord(recordsList, currentUser.username, form.species)
    if (personalBest) {
      const oldLb = parseRecordWeightToLb(personalBest.weight)
      if (Number.isFinite(oldLb) && newLb > oldLb) {
        showConfirm(
          `¡Felicitaciones, rompiste tu propia marca en ${form.species}! Tu mejor registro era ${personalBest.weight}. ` +
            `Este registro de ${String(form.weight).trim()} lb lo reemplazará en el tablero. ¿Continuar?`,
          async () => {
            await persistRecord(
              personalBest.id,
              personalBest,
              'SUPERAR_RECORD_PERSONAL',
              '¡Récord personal superado! Ya está actualizado en el tablero del portal.',
            )
          },
        )
        return
      }
    }

    await persistRecord(Date.now(), null, 'NUEVO_RECORD', '¡Récord publicado en el tablero del portal!')
  }

  const handleDelete = (record) => {
    showConfirm(`¿Eliminar el récord de ${record.angler} (${record.species})?`, async () => {
      try { await deleteRecord(record.id); logAction?.('ELIMINAR_RECORD', record.species); showAlert('Récord eliminado.') }
      catch { showAlert('No se pudo eliminar.') }
    })
  }

  const handleToggleClubVisibility = async (record) => {
    if (record.adminSuppressed) {
      showAlert('Un administrador retiró esta publicación del muro. Escribe a los administradores del portal si crees que fue un error.')
      return
    }
    const next = !(record.clubVisible !== false)
    try {
      await saveRecord({ ...record, clubVisible: next })
      logAction?.(next ? 'RECORD_VISIBLE_CLUB' : 'RECORD_OCULTO_CLUB', String(record.id))
    } catch {
      showAlert('No se pudo actualizar la visibilidad.')
    }
  }

  const handleAdminSuppress = (record) => {
    showConfirm(
      '¿Retirar esta captura del muro por moderación? Dejará de verse para quienes navegan el muro hasta que un administrador la restaure.',
      async () => {
        try {
          await saveRecord({ ...record, adminSuppressed: true })
          logAction?.('RECORD_MODERACION_OCULTAR', String(record.id))
          showAlert('Captura retirada del muro público.')
        } catch {
          showAlert('No se pudo aplicar la moderación.')
        }
      },
    )
  }

  const handleAdminRestore = (record) => {
    showConfirm(
      '¿Quitar el retiro por moderación? Si quien publicó la dejó como visible, volverá al muro para todos.',
      async () => {
        try {
          await saveRecord({ ...record, adminSuppressed: false })
          logAction?.('RECORD_MODERACION_RESTAURAR', String(record.id))
          showAlert('Moderación quitada.')
        } catch {
          showAlert('No se pudo restaurar.')
        }
      },
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <ImageCropDialog
        open={imageCropSource != null}
        file={imageCropSource}
        title="Recorta la foto del récord"
        onCancel={() => setImageCropSource(null)}
        onConfirm={(cropped) => {
          setImageFile(cropped)
          setImageCropSource(null)
          setForm((prev) => ({ ...prev, image: '' }))
        }}
      />
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-black text-zinc-900">Récords de la comunidad</h2>
          <p className="text-zinc-500 mt-1 max-w-3xl leading-relaxed">
            Aquí celebramos <span className="font-bold text-zinc-700">{TENANT.slogan}</span>: no es un podio para compararnos entre nosotros, sino un espacio para llevar con orgullo y humildad lo que cada uno logró, e inspirarnos a superarnos a nosotros mismos. Anímense a publicar la suya.
          </p>
        </div>
        {!isGuestUser && (
          <button
            type="button"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true) }}
            className="bg-amber-500 text-zinc-950 px-5 py-3 rounded-xl font-black flex items-center justify-center shadow-sm hover:bg-amber-400 transition-colors shrink-0 self-start md:pt-1"
          >
            {showForm ? 'Cancelar' : <><PlusCircle className="w-5 h-5 mr-2" /> Registrar Captura</>}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-amber-200 shadow-md animate-in slide-in-from-top-4">
          <h3 className="text-xl font-black mb-5 text-amber-900 flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-amber-500" /> {editingId ? 'Editar Récord' : 'Nueva Captura Destacada'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Especie *</label>
                <select value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-amber-500 font-medium">
                  {RECORD_SPECIES_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Peso (lb) *</label>
                <div className="flex items-stretch rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden focus-within:ring-2 focus-within:ring-amber-500">
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    placeholder="Ej: 28"
                    className="flex-1 min-w-0 p-3 border-0 bg-transparent outline-none font-medium"
                  />
                  <span className="flex items-center px-4 text-sm font-black text-zinc-600 bg-zinc-100 border-l border-zinc-200 shrink-0">lb</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Lugar *</label>
                <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ej: Embalse Peñol-Guatapé" className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Fecha de captura *</label>
                <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-zinc-700 mb-1">Foto (opcional)</label>
                <label className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus-within:ring-2 focus-within:ring-amber-500 flex items-center gap-2 cursor-pointer">
                  <UploadCloud className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-zinc-700 truncate">{imageFile ? imageFile.name : 'Subir desde tu dispositivo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      if (!file) return
                      if (file.size > MAX_ENTITY_IMAGE_SOURCE_BYTES) {
                        showAlert(`El archivo es demasiado grande (máx. ${Math.round(MAX_ENTITY_IMAGE_SOURCE_BYTES / 1024 / 1024)} MB en tu dispositivo).`)
                        e.target.value = ''
                        return
                      }
                      e.target.value = ''
                      setImageCropSource(file)
                    }}
                  />
                </label>
                <p className="mt-1 text-xs text-zinc-500">
                  Elige una foto (hasta {Math.round(MAX_ENTITY_IMAGE_SOURCE_BYTES / 1024 / 1024)} MB); podrás elegir proporción del recorte (16:9, vertical 9:16, etc.). Luego la optimizamos para que no pese más de{' '}
                  {Math.round(MAX_ENTITY_IMAGE_BYTES / 1024)} KB al subirla.
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-zinc-700 mb-1">Notas (equipo, señuelo, condiciones)</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-amber-500 h-20" placeholder="Comparte los detalles de la captura para la comunidad..." />
              </div>
              <div className="md:col-span-2 flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
                <input
                  id="record-muro-visible"
                  type="checkbox"
                  checked={form.clubVisible !== false}
                  onChange={(e) => setForm({ ...form, clubVisible: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="record-muro-visible" className="text-sm font-medium text-zinc-700 leading-snug cursor-pointer">
                  <span className="font-bold text-zinc-900">Mostrar en el muro público del portal</span>
                  <span className="block text-zinc-500 text-xs mt-1 font-normal">
                    Si lo desmarcas, la captura queda guardada pero solo tú (y moderación) la verán en esta lista. Puedes volver a activarla cuando quieras.
                  </span>
                </label>
              </div>
            </div>
            <button type="submit" disabled={saving} className="bg-amber-500 text-zinc-950 px-8 py-3 rounded-xl font-black hover:bg-amber-400 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Publicar Récord'}
            </button>
          </form>
        </div>
      )}

      {recordsList.length === 0 && !showForm && (
        <div className="rounded-3xl border border-dashed border-amber-200 bg-amber-50/40 px-6 py-12 text-center">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-zinc-800 font-bold text-lg mb-1">No hay récords registrados aún</p>
          <p className="text-zinc-500 text-sm">¡Sé el primero en registrar una captura destacada!</p>
        </div>
      )}

      {recordsList.length > 0 && visibilityFiltered.length === 0 && !showForm && (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
          <p className="text-zinc-800 font-bold mb-1">No hay capturas visibles en el muro</p>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">
            {isGuestUser
              ? 'Quienes tienen cuenta aprobada pueden publicar récords y elegir si los muestran a todos. Vuelve más tarde o solicita acceso para compartir la tuya.'
              : 'Si ocultaste las tuyas o un administrador retiró alguna por moderación, aquí no aparecerán hasta que se restauren o las reactives.'}
          </p>
        </div>
      )}

      {visibilityFiltered.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-3 sm:gap-y-2">
            <div className="flex flex-col gap-1 shrink-0 sm:min-w-[5.5rem]">
              <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 leading-none min-h-[14px] flex items-end">
                Filtrar
              </span>
              <div
                className="flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-zinc-600"
                aria-hidden
              >
                <Filter className="w-4 h-4 shrink-0 text-amber-600" />
              </div>
            </div>
            <div className="min-w-0 flex-1 sm:min-w-[160px] flex flex-col gap-1">
              <label htmlFor="records-filter-species" className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 leading-none min-h-[14px] flex items-end">
                Especie
              </label>
              <select
                id="records-filter-species"
                value={filterSpecies}
                onChange={(e) => setFilterSpecies(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold text-zinc-800 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Todas las especies</option>
                {speciesFilterOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="min-w-0 flex-1 sm:min-w-[160px] flex flex-col gap-1">
              <label htmlFor="records-filter-angler" className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 leading-none min-h-[14px] flex items-end">
                Pescador
              </label>
              <select
                id="records-filter-angler"
                value={filterAngler}
                onChange={(e) => setFilterAngler(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold text-zinc-800 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Todos los pescadores</option>
                {anglerFilterOptions.map(([username, label]) => (
                  <option key={username} value={username}>{label}</option>
                ))}
              </select>
            </div>
            {(filterSpecies || filterAngler) && (
              <div className="flex flex-col gap-1 shrink-0 sm:min-w-[8.5rem]">
                <span className="min-h-[14px] text-[10px] font-bold uppercase leading-none invisible select-none" aria-hidden="true">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => { setFilterSpecies(''); setFilterAngler('') }}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-600 hover:bg-zinc-50 sm:w-auto sm:whitespace-nowrap"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {visibilityFiltered.length > 0 && filteredRecords.length === 0 && !showForm && (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
          <p className="text-zinc-800 font-bold mb-1">Ningún récord coincide con los filtros</p>
          <p className="text-zinc-500 text-sm">Prueba otra especie o pescador, o limpia los filtros.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRecords.map((record) => {
          const isOwner = currentUser.username === record.anglerUsername
          const canEdit = (isOwner || canManage) && !isGuestUser
          const hasVisibilityBanner = record.adminSuppressed || !isPublicOnClubWall(record)
          return (
            <div key={record.id} className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden relative group hover:shadow-md transition-all">
              {record.adminSuppressed && (
                <div className="px-3 py-2 text-xs font-black uppercase tracking-wide bg-rose-100 text-rose-900 border-b border-rose-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  Retirada del muro por moderación
                </div>
              )}
              {!record.adminSuppressed && !isPublicOnClubWall(record) && (
                <div className="px-3 py-2 text-xs font-bold bg-zinc-100 text-zinc-700 border-b border-zinc-200">
                  {isOwner ? 'Oculta para el resto (solo tú y moderación la ven aquí)' : 'Quien publicó la ocultó del muro público'}
                </div>
              )}
              {canEdit && (
                <div className={`absolute right-3 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10 ${hasVisibilityBanner ? 'top-14' : 'top-3'}`}>
                  <button type="button" onClick={() => { const w = (record.weight || '').trim().split(/\s+/); setForm({ species: record.species, weight: w[0] || '', location: record.location, date: record.date || '', image: record.image || '', notes: record.notes || '', clubVisible: record.clubVisible !== false }); setImageFile(null); setImageCropSource(null); setEditingId(record.id); setShowForm(true) }} className="p-2 bg-white/95 shadow text-amber-700 rounded-lg border border-amber-100 hover:bg-amber-50"><Edit3 className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleDelete(record)} className="p-2 bg-white/95 shadow text-red-700 rounded-lg border border-red-100 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
              {record.image ? (
                <div className="w-full aspect-video bg-zinc-100 overflow-hidden">
                  <div className="h-full w-full min-w-0 min-h-0 flex items-center justify-center">
                    <img
                      src={record.image}
                      alt={record.species}
                      className="block h-full w-auto max-w-full object-contain object-center group-hover:scale-[1.02] transition-transform duration-700"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                  <Fish className="w-16 h-16 text-blue-200" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-2xl font-black text-zinc-900">{record.weight}</span>
                </div>
                <h4 className="text-lg font-black text-blue-700 mb-3">{record.species}</h4>
                <div className="space-y-1 text-xs font-bold text-zinc-500">
                  <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-blue-400" />{record.angler} {isOwner && !isGuestUser && '(Tú)'}</p>
                  <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-400" />{record.location}</p>
                  {record.date && <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-400" />{new Date(record.date + 'T12:00').toLocaleDateString('es-CO')}</p>}
                </div>
                {record.notes && <p className="text-zinc-600 text-xs mt-3 leading-relaxed line-clamp-2">{record.notes}</p>}
                {isOwner && !isGuestUser && (
                  <div className="mt-4 pt-3 border-t border-zinc-100">
                    <button
                      type="button"
                      disabled={Boolean(record.adminSuppressed)}
                      onClick={() => void handleToggleClubVisibility(record)}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black border transition-colors ${
                        record.adminSuppressed
                          ? 'border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed'
                          : record.clubVisible !== false
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                            : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      {record.clubVisible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {record.clubVisible !== false ? 'Visible en el muro público' : 'Oculta del muro (solo tú y moderación)'}
                    </button>
                  </div>
                )}
                {canManage && (
                  <div className="mt-3 pt-3 border-t border-amber-100/80">
                    {!record.adminSuppressed ? (
                      <button
                        type="button"
                        onClick={() => handleAdminSuppress(record)}
                        className="w-full py-2 rounded-xl text-xs font-black border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
                      >
                        Retirar del muro (moderación)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAdminRestore(record)}
                        className="w-full py-2 rounded-xl text-xs font-black border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                      >
                        Quitar retiro por moderación
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RecordsView
