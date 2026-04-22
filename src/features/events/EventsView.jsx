import { useState } from 'react'
import { PlusCircle, CalendarDays, MapPin, Edit3, Trash2, Loader2, UploadCloud, Sparkles, ArrowLeft } from 'lucide-react'
import { isAdminLike, formatPortalEventWhen, requestPolishedText } from '../../shared/utils.js'
import {
  MAX_ENTITY_IMAGE_BYTES,
  MAX_ENTITY_IMAGE_SOURCE_BYTES,
  uploadEntityImageFile,
} from '../../firestore/uploadEntityImage.js'
import { fetchGeminiDescriptionFromTitle, isGeminiConfigured, getLastGeminiDetail } from '../../geminiClient.js'
import { ImageCropDialog } from '../../shared/ImageCropDialog.jsx'
import { portalDateToSortMs } from '../../shared/portalDates.js'

const emptyForm = () => ({ title: '', date: '', location: '', description: '', image: '' })

const EventsView = ({ currentUser, db, saveEvent, deleteEvent, logAction, showAlert, showConfirm }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imageCropSource, setImageCropSource] = useState(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const canManage = isAdminLike(currentUser)
  const aiEnabled = isGeminiConfigured()

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm())
    setImageFile(null)
    setImageCropSource(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const isEditing = editingId != null
      const prev = isEditing ? (db.events || []).find((ev) => ev.id === editingId) : null
      const eventId = editingId || Date.now()
      const imageUrl = imageFile
        ? await uploadEntityImageFile(imageFile, 'events', eventId)
        : (form.image || null)
      await saveEvent({
        ...(prev || {}),
        id: eventId,
        title: form.title,
        date: form.date,
        location: form.location,
        description: form.description,
        image: imageUrl,
      })
      logAction?.(isEditing ? 'EDITAR_EVENTO' : 'NUEVO_EVENTO', form.title)
      resetForm()
      showAlert(isEditing ? 'Evento actualizado.' : 'Evento publicado.')
    } catch (err) {
      if (err instanceof Error && err.message === 'ENTITY_IMAGE_TOO_LARGE') {
        showAlert(`No pudimos reducir la foto lo suficiente (límite de subida ${Math.round(MAX_ENTITY_IMAGE_BYTES / 1024)} KB). Prueba con otra imagen.`)
      } else if (err instanceof Error && err.message === 'ENTITY_IMAGE_DECODE_FAILED') {
        showAlert('No se pudo procesar la imagen. Prueba con JPG o PNG.')
      } else if (err instanceof Error && err.message === 'ENTITY_IMAGE_STORAGE_UNAVAILABLE') {
        showAlert('La subida de imágenes no está disponible: revisa la configuración de Firebase.')
      } else {
        showAlert('No se pudo guardar el evento.')
      }
    } finally { setSaving(false) }
  }

  const handleDelete = (ev) => {
    showConfirm(`¿Eliminar el evento "${ev.title}"?`, async () => {
      try { await deleteEvent(ev.id); logAction?.('ELIMINAR_EVENTO', ev.title); showAlert('Evento eliminado.') }
      catch { showAlert('No se pudo eliminar.') }
    })
  }

  const handleAiPolish = async () => {
    if (!form.title.trim() && !form.description.trim()) {
      return showAlert('Escribe título o descripción para usar la IA.')
    }
    if (!isGeminiConfigured()) return showAlert('Configura VITE_GEMINI_API_KEY en .env para usar la IA.')
    setAiBusy(true)
    try {
      const prevTitle = form.title.trim()
      const prevDescription = form.description.trim()
      const [title, description] = await Promise.all([
        requestPolishedText('event_title', form.title),
        requestPolishedText('event_description', form.description),
      ])
      const nextTitle = (title || form.title).trim()
      const nextDescription = (description || form.description).trim()
      const changed = nextTitle !== prevTitle || nextDescription !== prevDescription
      setForm((prev) => ({
        ...prev,
        title: title || prev.title,
        description: description || prev.description,
      }))
      showAlert(changed ? 'Texto del evento mejorado con IA. Revísalo antes de publicar.' : 'La IA respondió, pero no encontró cambios relevantes para mejorar.')
    } catch {
      showAlert(getLastGeminiDetail() || 'No se pudo mejorar el texto con IA.')
    } finally {
      setAiBusy(false)
    }
  }

  const handleDescriptionFromTitle = async () => {
    if (!form.title.trim()) return showAlert('Escribe el título primero.')
    if (!isGeminiConfigured()) return showAlert('Configura VITE_GEMINI_API_KEY en .env para usar la IA.')
    setAiBusy(true)
    try {
      const prevDescription = form.description.trim()
      const res = await fetchGeminiDescriptionFromTitle(form.title, 'event')
      if (res?.description) {
        const nextDescription = String(res.description).trim()
        setForm((p) => ({ ...p, description: res.description }))
        showAlert(nextDescription !== prevDescription
          ? 'Descripción sugerida desde el título. Revísala antes de publicar.'
          : 'La IA respondió, pero la descripción quedó igual a la actual.')
      } else {
        showAlert(getLastGeminiDetail() || 'No se pudo generar la descripción.')
      }
    } catch {
      showAlert('Error al contactar la IA.')
    } finally {
      setAiBusy(false)
    }
  }

  const eventTimeOrId = (ev) => portalDateToSortMs(ev.date) ?? (Number(ev.id) || 0)

  const upcoming = [...(db.events || [])]
    .filter((ev) => new Date(ev.date) >= new Date())
    .sort((a, b) => eventTimeOrId(a) - eventTimeOrId(b))

  const past = [...(db.events || [])]
    .filter((ev) => new Date(ev.date) < new Date())
    .sort((a, b) => eventTimeOrId(b) - eventTimeOrId(a))

  if (selectedEvent) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedEvent(null)}
            className="flex items-center text-blue-700 font-bold hover:text-blue-800 bg-white px-4 py-2 rounded-xl shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Volver a Eventos
          </button>
          {canManage && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    title: selectedEvent.title,
                    date: selectedEvent.date,
                    location: selectedEvent.location || '',
                    description: selectedEvent.description || '',
                    image: selectedEvent.image || '',
                  })
                  setImageFile(null)
                  setImageCropSource(null)
                  setEditingId(selectedEvent.id)
                  setShowForm(true)
                  setSelectedEvent(null)
                }}
                className="inline-flex items-center bg-white border border-blue-200 text-blue-800 px-3 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-blue-50"
              >
                <Edit3 className="w-4 h-4 mr-1.5" /> Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  const ev = selectedEvent
                  setSelectedEvent(null)
                  handleDelete(ev)
                }}
                className="inline-flex items-center bg-white border border-red-200 text-red-700 px-3 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Eliminar
              </button>
            </div>
          )}
        </div>
        <article className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          {selectedEvent.image && (
            <div className="bg-zinc-100 p-4 md:p-6">
              <img
                src={selectedEvent.image}
                alt={selectedEvent.title}
                className="w-full max-h-[28rem] object-contain rounded-2xl"
              />
            </div>
          )}
          <div className="p-6 md:p-10">
            <h2 className="text-3xl font-black text-zinc-900 mb-4 leading-tight">{selectedEvent.title}</h2>
            <div className="flex flex-wrap items-center text-sm font-bold text-zinc-500 mb-6 gap-6 border-b border-zinc-100 pb-6">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-blue-500" />
                {formatPortalEventWhen(selectedEvent.date)}
              </span>
              {selectedEvent.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  {selectedEvent.location}
                </span>
              )}
            </div>
            {selectedEvent.description && (
              <div className="text-zinc-800 text-base leading-relaxed whitespace-pre-wrap">
                {selectedEvent.description}
              </div>
            )}
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
        title="Recorta la foto del evento"
        onCancel={() => setImageCropSource(null)}
        onConfirm={(cropped) => {
          setImageFile(cropped)
          setImageCropSource(null)
          setForm((prev) => ({ ...prev, image: '' }))
        }}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900">Eventos del grupo</h2>
          <p className="text-zinc-500 mt-1">Torneos, salidas, asambleas y reuniones.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true) }}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold flex items-center shadow-sm hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancelar' : <><PlusCircle className="w-5 h-5 mr-2" /> Nuevo Evento</>}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-blue-100 shadow-md animate-in slide-in-from-top-4">
          <h3 className="text-xl font-black mb-5 text-blue-900">{editingId ? 'Editar Evento' : 'Nuevo Evento'}</h3>
          {aiEnabled && <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 mb-4">
            <button type="button" onClick={() => void handleAiPolish()} disabled={aiBusy} className="inline-flex items-center rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-800 hover:bg-amber-100 disabled:opacity-60">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
              {aiBusy ? 'Procesando…' : 'Mejorar lo que escribí (IA)'}
            </button>
            <button type="button" onClick={() => void handleDescriptionFromTitle()} disabled={aiBusy} className="inline-flex items-center rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-50 disabled:opacity-60">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
              Descripción desde el título
            </button>
            <p className="text-xs text-zinc-600">Mejorar pulirá título y texto si ya los tienes. Descripción desde el título rellena o sustituye el texto según el título; revísala siempre antes de enviar.</p>
          </div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Título *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Fecha y hora *</label>
                <input required type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Lugar *</label>
                <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ej: Embalse Peñol-Guatapé" className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 h-24" placeholder="Detalles del evento, qué llevar, cómo inscribirse..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Foto del evento (opcional)</label>
              <label className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus-within:ring-2 focus-within:ring-blue-500 flex items-center gap-2 cursor-pointer">
                <UploadCloud className="w-4 h-4 text-blue-600" />
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
                Elige una foto (hasta {Math.round(MAX_ENTITY_IMAGE_SOURCE_BYTES / 1024 / 1024)} MB); podrás encuadrarla en 16:9 antes de guardar. Luego la optimizamos para que no pese más de{' '}
                {Math.round(MAX_ENTITY_IMAGE_BYTES / 1024)} KB al subirla.
              </p>
            </div>
            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Publicar Evento'}
            </button>
          </form>
        </div>
      )}

      {(db.events || []).length === 0 && !showForm && (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
          <CalendarDays className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
          <p className="text-zinc-800 font-bold text-lg mb-1">No hay eventos programados</p>
          <p className="text-zinc-500 text-sm">Los eventos publicados en el portal aparecerán aquí.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-zinc-700 uppercase tracking-widest text-xs border-b border-zinc-100 pb-2">Próximos eventos</h3>
          {upcoming.map((ev) => (
            <EventCard key={ev.id} ev={ev} canManage={canManage} onOpen={() => setSelectedEvent(ev)} onEdit={() => { setForm({ title: ev.title, date: ev.date, location: ev.location || '', description: ev.description || '', image: ev.image || '' }); setImageFile(null); setImageCropSource(null); setEditingId(ev.id); setShowForm(true) }} onDelete={() => handleDelete(ev)} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-4 opacity-60">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-100 pb-2">Eventos pasados</h3>
          {past.map((ev) => (
            <EventCard key={ev.id} ev={ev} canManage={canManage} onOpen={() => setSelectedEvent(ev)} onEdit={() => { setForm({ title: ev.title, date: ev.date, location: ev.location || '', description: ev.description || '', image: ev.image || '' }); setImageFile(null); setImageCropSource(null); setEditingId(ev.id); setShowForm(true) }} onDelete={() => handleDelete(ev)} />
          ))}
        </div>
      )}
    </div>
  )
}

function EventCard({ ev, canManage, onOpen, onEdit, onDelete }) {
  const isPast = new Date(ev.date) < new Date()
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
      className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden relative group hover:border-blue-200 transition-colors cursor-pointer"
    >
      {ev.image && (
        <div className="aspect-video w-full bg-zinc-100 overflow-hidden">
          <img src={ev.image} alt={ev.title} className="h-full w-full object-cover object-center" />
        </div>
      )}
      <div className="p-6 flex flex-col md:flex-row gap-5">
      {canManage && (
        <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()} role="presentation">
          <button onClick={onEdit} className="p-2 bg-zinc-50 hover:bg-blue-50 text-blue-600 rounded-lg"><Edit3 className="w-4 h-4" /></button>
          <button onClick={onDelete} className="p-2 bg-zinc-50 hover:bg-red-50 text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
        </div>
      )}
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${isPast ? 'bg-zinc-100' : 'bg-blue-600'}`}>
        <CalendarDays className={`w-8 h-8 ${isPast ? 'text-zinc-400' : 'text-white'}`} />
      </div>
      <div className="flex-1 min-w-0 pr-12 md:pr-0">
        <h4 className="text-xl font-black text-zinc-900 mb-1">{ev.title}</h4>
        <div className="flex flex-wrap gap-3 text-sm font-bold text-zinc-500 mb-2">
          <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-blue-500" />{formatPortalEventWhen(ev.date)}</span>
          {ev.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-500" />{ev.location}</span>}
        </div>
        {ev.description && <p className="text-zinc-600 text-sm line-clamp-4">{ev.description}</p>}
      </div>
      </div>
    </article>
  )
}

export default EventsView
