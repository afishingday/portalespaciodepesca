import { useMemo, useState } from 'react'
import {
  PlusCircle, Trophy, User, Calendar, MapPin, Edit3, Trash2, Loader2, Fish, UploadCloud, Filter,
  Eye, EyeOff, ShieldAlert, ArrowLeft,
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
import {
  findPersonalBestRecord,
  parseRecordWeightToLb,
  formatRecordSizeDisplay,
} from '../../shared/recordWeight.js'
import { isPublicOnClubWall, recordShownInRecordsGrid } from '../../shared/recordVisibility.js'
import { displayPortalDate, parseToIsoDate } from '../../shared/portalDates.js'
import { db as firestoreDb, useLocalPortalData } from '../../firebase.js'
import ReactionBar from '../../reactions/ReactionBar.jsx'
import { PORTAL_REACTION_APP_CONTEXT } from '../../shared/portalReactionsContext.js'

const emptyForm = () => ({
  species: defaultRecordSpeciesSelect(),
  weight: '',
  lengthCm: '',
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
  const [selectedRecord, setSelectedRecord] = useState(null)
  const canManage = isAdminLike(currentUser)
  const isGuestUser = isGuest(currentUser)
  const reactionUserId = isGuestUser ? null : currentUser.username
  const showReactions = !useLocalPortalData && firestoreDb

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
    setSelectedRecord(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!String(form.location ?? '').trim()) return showAlert('El lugar es obligatorio.')

    const newLb = parseFloat(String(form.weight).replace(',', '.'))
    const hasWeight = String(form.weight ?? '').trim() !== '' && Number.isFinite(newLb) && newLb > 0

    const lengthRaw = String(form.lengthCm ?? '').replace(',', '.').trim()
    const lengthParsed = lengthRaw === '' ? NaN : parseFloat(lengthRaw)
    const hasLength = Number.isFinite(lengthParsed) && lengthParsed > 0

    if (!hasWeight && !hasLength) {
      return showAlert('Indica al menos el peso (libras) o la medida total en centímetros.')
    }
    if (String(form.weight ?? '').trim() !== '' && !hasWeight) {
      return showAlert('El peso en libras debe ser un número mayor que cero, o déjalo vacío si solo vas a poner la medida en cm.')
    }
    if (String(form.lengthCm ?? '').trim() !== '' && !hasLength) {
      return showAlert('La medida en cm debe ser un número mayor que cero.')
    }

    const isEditing = editingId != null
    const prevRow = isEditing ? recordsList.find((r) => String(r.id) === String(editingId)) : null
    const hasImage = Boolean(imageFile) || Boolean(String(form.image || '').trim()) || Boolean(prevRow?.image)
    if (!hasImage) {
      return showAlert('La foto de la captura es obligatoria. Sube una imagen desde tu dispositivo.')
    }

    const persistRecord = async (recordId, prevForMerge, logCode, successMsg) => {
      setSaving(true)
      try {
        const imageUrl = imageFile
          ? await uploadEntityImageFile(imageFile, 'records', recordId)
          : (form.image || prevForMerge?.image || null)
        if (!imageUrl) {
          setSaving(false)
          showAlert('La foto de la captura es obligatoria.')
          return
        }
        const weightStr = hasWeight ? `${String(form.weight).trim().replace(',', '.')} lb` : ''
        const lengthCmVal = hasLength ? Math.round(lengthParsed * 100) / 100 : null
        const record = {
          ...(prevForMerge || {}),
          id: recordId,
          species: form.species,
          weight: weightStr,
          lengthCm: lengthCmVal,
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
        logAction?.(logCode, `${record.species} - ${formatRecordSizeDisplay(record)}`)
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

    if (hasWeight) {
      const personalBest = findPersonalBestRecord(recordsList, currentUser.username, form.species)
      if (personalBest) {
        const oldLb = parseRecordWeightToLb(personalBest.weight)
        if (Number.isFinite(oldLb) && newLb > oldLb) {
          showConfirm(
            `¡Felicitaciones, rompiste tu propia marca en ${form.species}! Tu mejor registro era ${formatRecordSizeDisplay(personalBest)}. ` +
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
    }

    await persistRecord(Date.now(), null, 'NUEVO_RECORD', '¡Récord publicado en el tablero del portal!')
  }

  const handleDelete = (record) => {
    showConfirm(`¿Eliminar el récord de ${record.angler} (${record.species})?`, async () => {
      try {
        await deleteRecord(record.id)
        logAction?.('ELIMINAR_RECORD', record.species)
        showAlert('Récord eliminado.')
        setSelectedRecord((prev) => (prev && String(prev.id) === String(record.id) ? null : prev))
      }
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

  const openRecordDetail = (record) => {
    if (!recordShownInRecordsGrid(record, currentUser, canManage)) return
    setSelectedRecord(record)
  }

  if (selectedRecord) {
    const detailRecord = recordsList.find((x) => String(x.id) === String(selectedRecord.id))
    if (!detailRecord) {
      return (
        <div className="space-y-6 animate-in fade-in">
          <button
            type="button"
            onClick={() => setSelectedRecord(null)}
            className="flex items-center text-amber-800 font-bold hover:text-amber-900 bg-white px-4 py-2 rounded-xl shadow-sm border border-amber-100 w-fit"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Volver al tablero
          </button>
          <p className="text-zinc-600 text-sm font-medium">Esta captura ya no está en el listado (puede haberse eliminado).</p>
        </div>
      )
    }
    if (!recordShownInRecordsGrid(detailRecord, currentUser, canManage)) {
      return (
        <div className="space-y-6 animate-in fade-in">
          <button
            type="button"
            onClick={() => setSelectedRecord(null)}
            className="flex items-center text-amber-800 font-bold hover:text-amber-900 bg-white px-4 py-2 rounded-xl shadow-sm border border-amber-100 w-fit"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Volver
          </button>
          <p className="text-zinc-600 text-sm font-medium">Esta captura no está disponible.</p>
        </div>
      )
    }
    const isOwner = currentUser.username === detailRecord.anglerUsername
    const canEdit = (isOwner || canManage) && !isGuestUser
    const canDelete = canEdit
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedRecord(null)}
            className="flex items-center text-amber-800 font-bold hover:text-amber-900 bg-white px-4 py-2 rounded-xl shadow-sm border border-amber-100 w-fit"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Volver al tablero
          </button>
          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const w = (detailRecord.weight || '').trim().split(/\s+/)
                  const cm = detailRecord.lengthCm
                  setForm({
                    species: detailRecord.species,
                    weight: w[0] || '',
                    lengthCm: cm != null && cm !== '' && Number.isFinite(Number(cm)) ? String(cm) : '',
                    location: detailRecord.location,
                    date: detailRecord.date || '',
                    image: detailRecord.image || '',
                    notes: detailRecord.notes || '',
                    clubVisible: detailRecord.clubVisible !== false,
                  })
                  setImageFile(null)
                  setImageCropSource(null)
                  setEditingId(detailRecord.id)
                  setShowForm(true)
                  setSelectedRecord(null)
                }}
                className="inline-flex items-center bg-white border border-amber-200 text-amber-900 px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-amber-50"
              >
                <Edit3 className="w-4 h-4 mr-2" /> Editar
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(detailRecord)}
                  className="inline-flex items-center bg-white border border-red-200 text-red-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                </button>
              )}
            </div>
          )}
        </div>
        <article className="bg-white rounded-3xl border border-zinc-200 shadow-sm max-w-6xl mx-auto w-full overflow-hidden lg:overflow-visible">
          {detailRecord.adminSuppressed && (
            <div className="px-4 py-3 text-xs font-black uppercase tracking-wide bg-rose-100 text-rose-900 border-b border-rose-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Retirada del muro por moderación
            </div>
          )}
          {!detailRecord.adminSuppressed && !isPublicOnClubWall(detailRecord) && (
            <div className="px-4 py-3 text-xs font-bold bg-zinc-100 text-zinc-700 border-b border-zinc-200">
              {isOwner ? 'Oculta para el resto del muro público' : 'Quien publicó la ocultó del muro público'}
            </div>
          )}
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
            {/* Columna imagen */}
            <div className="bg-zinc-100 lg:border-r border-zinc-200/80 flex items-center justify-center min-h-[220px] lg:min-h-[min(80vh,34rem)] lg:max-h-[min(90vh,38rem)] self-start">
              {detailRecord.image ? (
                <img
                  src={detailRecord.image}
                  alt={detailRecord.species}
                  className="w-full h-full max-h-[min(55vh,28rem)] lg:max-h-[min(85vh,36rem)] object-contain p-4 md:p-6"
                />
              ) : (
                <div className="aspect-video w-full max-h-72 flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
                  <Fish className="w-20 h-20 text-blue-200" />
                </div>
              )}
            </div>
            {/* Columna texto y acciones */}
            <div className="p-5 sm:p-7 lg:p-8 min-w-0 flex flex-col">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-5">
                <span className="text-3xl sm:text-4xl font-black text-amber-600 tabular-nums break-words max-w-full">{formatRecordSizeDisplay(detailRecord)}</span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-800 leading-tight">{detailRecord.species}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/90 px-4 py-3 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">Pescador</p>
                  <p className="text-sm font-bold text-zinc-800 flex items-start gap-2">
                    <User className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="break-words">{detailRecord.angler}</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/90 px-4 py-3 min-w-0 sm:col-span-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">Lugar</p>
                  <p className="text-sm font-bold text-zinc-800 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="break-words">{detailRecord.location}</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/90 px-4 py-3 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">Fecha</p>
                  <p className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                    {detailRecord.date ? displayPortalDate(parseToIsoDate(detailRecord.date)) : '—'}
                  </p>
                </div>
              </div>
              {detailRecord.notes ? (
                <div className="rounded-2xl border border-amber-100/60 bg-amber-50/25 px-5 py-4 mb-6 flex-1 min-h-0">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-800/70 mb-2">Notas</h3>
                  <p className="text-zinc-800 text-base sm:text-lg leading-relaxed whitespace-pre-wrap break-words">{detailRecord.notes}</p>
                </div>
              ) : (
                <p className="text-sm text-zinc-400 italic mb-6">Sin notas adicionales.</p>
              )}
              {showReactions && (
                <div className="mt-auto pt-5 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 shrink-0">Reacciones</p>
                  <ReactionBar
                    db={firestoreDb}
                    appContext={PORTAL_REACTION_APP_CONTEXT}
                    contentType="records"
                    contentId={detailRecord.id}
                    userId={reactionUserId}
                    className="flex-1 min-w-0 sm:justify-end"
                  />
                </div>
              )}
              {isOwner && !isGuestUser && (
                <div className="mt-5 pt-5 border-t border-zinc-100">
                  <button
                    type="button"
                    disabled={Boolean(detailRecord.adminSuppressed)}
                    onClick={() => void handleToggleClubVisibility(detailRecord)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black border transition-colors ${
                      detailRecord.adminSuppressed
                        ? 'border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed'
                        : detailRecord.clubVisible !== false
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    {detailRecord.clubVisible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {detailRecord.clubVisible !== false ? 'Visible en el muro público' : 'Oculta del muro (solo tú y moderación)'}
                  </button>
                </div>
              )}
              {canManage && (
                <div className="mt-4 pt-4 border-t border-amber-100/80">
                  {!detailRecord.adminSuppressed ? (
                    <button
                      type="button"
                      onClick={() => handleAdminSuppress(detailRecord)}
                      className="w-full py-2.5 rounded-xl text-xs font-black border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
                    >
                      Retirar del muro (moderación)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAdminRestore(detailRecord)}
                      className="w-full py-2.5 rounded-xl text-xs font-black border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                    >
                      Quitar retiro por moderación
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <ImageCropDialog
        open={imageCropSource != null}
        file={imageCropSource}
        title="Recorta la foto del récord (obligatoria)"
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
            onClick={() => { if (showForm) resetForm(); else { setSelectedRecord(null); setShowForm(true) } }}
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
                <label className="block text-sm font-bold text-zinc-700 mb-1">Peso (libras)</label>
                <div className="flex items-stretch rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden focus-within:ring-2 focus-within:ring-amber-500">
                  <input
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
                <label className="block text-sm font-bold text-zinc-700 mb-1">Medida total (cm)</label>
                <div className="flex items-stretch rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden focus-within:ring-2 focus-within:ring-amber-500">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.lengthCm}
                    onChange={(e) => setForm({ ...form, lengthCm: e.target.value })}
                    placeholder="Ej: 52"
                    className="flex-1 min-w-0 p-3 border-0 bg-transparent outline-none font-medium"
                  />
                  <span className="flex items-center px-4 text-sm font-black text-zinc-600 bg-zinc-100 border-l border-zinc-200 shrink-0">cm</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Lugar *</label>
                <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ej: Embalse Peñol-Guatapé" className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="md:col-span-2 rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2 text-xs text-amber-950 font-medium">
                Indica <span className="font-black">al menos uno</span>: peso en libras o medida en centímetros (puedes poner los dos).
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-zinc-700 mb-1">Fecha de captura *</label>
                <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full max-w-xs p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-zinc-700 mb-1">Foto de la captura *</label>
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
                  Obligatoria, igual que en el muro de lagañas. Hasta {Math.round(MAX_ENTITY_IMAGE_SOURCE_BYTES / 1024 / 1024)} MB; podrás elegir proporción del recorte. La optimizamos a máximo{' '}
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
            <article
              key={record.id}
              role="button"
              tabIndex={0}
              onClick={() => openRecordDetail(record)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openRecordDetail(record)
                }
              }}
              className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden relative group hover:shadow-md transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
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
                <div
                  className={`absolute right-3 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10 ${hasVisibilityBanner ? 'top-14' : 'top-3'}`}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  <button type="button" onClick={(e) => { e.stopPropagation(); const w = (record.weight || '').trim().split(/\s+/); const cm = record.lengthCm; setForm({ species: record.species, weight: w[0] || '', lengthCm: cm != null && cm !== '' && Number.isFinite(Number(cm)) ? String(cm) : '', location: record.location, date: record.date || '', image: record.image || '', notes: record.notes || '', clubVisible: record.clubVisible !== false }); setImageFile(null); setImageCropSource(null); setEditingId(record.id); setShowForm(true) }} className="p-2 bg-white/95 shadow text-amber-700 rounded-lg border border-amber-100 hover:bg-amber-50"><Edit3 className="w-4 h-4" /></button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(record) }} className="p-2 bg-white/95 shadow text-red-700 rounded-lg border border-red-100 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
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
                <div className="flex items-center gap-2 mb-2 min-w-0">
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-2xl font-black text-zinc-900 break-words min-w-0">{formatRecordSizeDisplay(record)}</span>
                </div>
                <h4 className="text-lg font-black text-blue-700 mb-3">{record.species}</h4>
                <div className="space-y-1 text-xs font-bold text-zinc-500">
                  <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-blue-400" />{record.angler} {isOwner && !isGuestUser && '(Tú)'}</p>
                  <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-400" />{record.location}</p>
                  {record.date && <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-400" />{new Date(record.date + 'T12:00').toLocaleDateString('es-CO')}</p>}
                </div>
                {record.notes && <p className="text-zinc-600 text-xs mt-3 leading-relaxed line-clamp-2">{record.notes}</p>}
                {showReactions && (
                  <div onClick={(e) => e.stopPropagation()} role="presentation">
                    <ReactionBar
                      db={firestoreDb}
                      appContext={PORTAL_REACTION_APP_CONTEXT}
                      contentType="records"
                      contentId={record.id}
                      userId={reactionUserId}
                      className="mt-3"
                    />
                  </div>
                )}
                {isOwner && !isGuestUser && (
                  <div className="mt-4 pt-3 border-t border-zinc-100" onClick={(e) => e.stopPropagation()} role="presentation">
                    <button
                      type="button"
                      disabled={Boolean(record.adminSuppressed)}
                      onClick={(e) => { e.stopPropagation(); void handleToggleClubVisibility(record) }}
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
                  <div className="mt-3 pt-3 border-t border-amber-100/80" onClick={(e) => e.stopPropagation()} role="presentation">
                    {!record.adminSuppressed ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleAdminSuppress(record) }}
                        className="w-full py-2 rounded-xl text-xs font-black border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
                      >
                        Retirar del muro (moderación)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleAdminRestore(record) }}
                        className="w-full py-2 rounded-xl text-xs font-black border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                      >
                        Quitar retiro por moderación
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default RecordsView
