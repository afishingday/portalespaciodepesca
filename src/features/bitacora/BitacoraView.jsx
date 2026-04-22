import { useState } from 'react'
import { PlusCircle, BookOpen, Fish, MapPin, Calendar, Loader2, Edit3, Trash2, UploadCloud } from 'lucide-react'
import { isGuest } from '../../shared/utils.js'
import {
  MAX_ENTITY_IMAGE_BYTES,
  MAX_ENTITY_IMAGE_SOURCE_BYTES,
  uploadEntityImageFile,
} from '../../firestore/uploadEntityImage.js'
import { ImageCropDialog } from '../../shared/ImageCropDialog.jsx'
import { RECORD_SPECIES_OPTIONS, defaultRecordSpeciesSelect } from '../../shared/fishingSpecies.js'

const emptyForm = () => ({
  species: defaultRecordSpeciesSelect(),
  weight: '',
  location: '',
  date: new Date().toISOString().split('T')[0], bait: '', notes: '', image: '',
})

const BitacoraView = ({ currentUser, db, saveBitacoraEntry, deleteBitacoraEntry, logAction, showAlert, showConfirm }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imageCropSource, setImageCropSource] = useState(null)
  const isGuestUser = isGuest(currentUser)

  const myEntries = (db.bitacora || []).filter((e) => e.username === currentUser.username)

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
    setSaving(true)
    try {
      const isEditing = editingId != null
      const prev = isEditing ? myEntries.find((en) => en.id === editingId) : null
      const entryId = editingId || Date.now()
      const imageUrl = imageFile
        ? await uploadEntityImageFile(imageFile, 'bitacora', entryId)
        : (form.image || null)
      await saveBitacoraEntry({
        ...(prev || {}),
        id: entryId,
        username: currentUser.username,
        anglerName: currentUser.name,
        species: form.species,
        weight: `${form.weight} lb`,
        location: form.location,
        date: form.date,
        bait: form.bait || '',
        notes: form.notes || '',
        image: imageUrl,
      })
      logAction?.(isEditing ? 'EDITAR_BITACORA' : 'NUEVA_BITACORA', `${form.species} en ${form.location}`)
      resetForm()
      showAlert(isEditing ? 'Entrada actualizada.' : 'Captura registrada en tu bitácora.')
    } catch (err) {
      if (err instanceof Error && err.message === 'ENTITY_IMAGE_TOO_LARGE') {
        showAlert(`No pudimos reducir la foto lo suficiente (límite de subida ${Math.round(MAX_ENTITY_IMAGE_BYTES / 1024)} KB). Prueba con otra imagen.`)
      } else if (err instanceof Error && err.message === 'ENTITY_IMAGE_DECODE_FAILED') {
        showAlert('No se pudo procesar la imagen. Prueba con JPG o PNG.')
      } else if (err instanceof Error && err.message === 'ENTITY_IMAGE_STORAGE_UNAVAILABLE') {
        showAlert('La subida de imágenes no está disponible: revisa la configuración de Firebase.')
      } else {
        showAlert('No se pudo guardar.')
      }
    } finally { setSaving(false) }
  }

  const handleDelete = (entry) => {
    showConfirm(`¿Eliminar la entrada de ${entry.species}?`, async () => {
      try { await deleteBitacoraEntry(entry.id); logAction?.('ELIMINAR_BITACORA', entry.species); showAlert('Entrada eliminada.') }
      catch { showAlert('No se pudo eliminar.') }
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <ImageCropDialog
        open={imageCropSource != null}
        file={imageCropSource}
        title="Recorta la foto de la captura"
        onCancel={() => setImageCropSource(null)}
        onConfirm={(cropped) => {
          setImageFile(cropped)
          setImageCropSource(null)
          setForm((prev) => ({ ...prev, image: '' }))
        }}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900">Mi Bitácora</h2>
          <p className="text-zinc-500 mt-1">Registro personal de tus capturas.</p>
        </div>
        {!isGuestUser && (
          <button
            type="button"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true) }}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold flex items-center shadow-sm hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancelar' : <><PlusCircle className="w-5 h-5 mr-2" /> Nueva Captura</>}
          </button>
        )}
      </div>

      {isGuestUser && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm font-bold text-blue-800">
          Solicita una cuenta aprobada para llevar tu bitácora personal de capturas.
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-blue-100 shadow-md animate-in slide-in-from-top-4">
          <h3 className="text-xl font-black mb-5 text-blue-900 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-blue-500" /> {editingId ? 'Editar Captura' : 'Registrar Captura'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Especie *</label>
                <select value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium">
                  {RECORD_SPECIES_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Peso (lb) *</label>
                <div className="flex items-stretch rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
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
                <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ej: Embalse Peñol-Guatapé" className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Fecha *</label>
                <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Señuelo / Carnada</label>
                <input value={form.bait} onChange={(e) => setForm({ ...form, bait: e.target.value })} placeholder="Ej: Popper blanco 7cm" className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Foto (opcional)</label>
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
                  Elige una foto (hasta {Math.round(MAX_ENTITY_IMAGE_SOURCE_BYTES / 1024 / 1024)} MB); podrás encuadrarla en 16:9. Luego la optimizamos para que no pese más de{' '}
                  {Math.round(MAX_ENTITY_IMAGE_BYTES / 1024)} KB al subirla.
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-zinc-700 mb-1">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 h-20" placeholder="Condiciones del día, equipo, técnica empleada..." />
              </div>
            </div>
            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Registrar'}
            </button>
          </form>
        </div>
      )}

      {myEntries.length === 0 && !showForm && !isGuestUser && (
        <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/40 px-6 py-12 text-center">
          <BookOpen className="w-12 h-12 text-blue-300 mx-auto mb-4" />
          <p className="text-zinc-800 font-bold text-lg mb-1">Tu bitácora está vacía</p>
          <p className="text-zinc-500 text-sm">Registra tus capturas para llevar un historial personal.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {myEntries.map((entry) => (
          <div key={entry.id} className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden group hover:shadow-md transition-all relative">
            <div className="absolute top-3 right-3 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button onClick={() => { const w = (entry.weight || '').trim().split(/\s+/); setForm({ species: entry.species, weight: w[0] || '', location: entry.location, date: entry.date || '', bait: entry.bait || '', notes: entry.notes || '', image: entry.image || '' }); setImageFile(null); setImageCropSource(null); setEditingId(entry.id); setShowForm(true) }} className="p-2 bg-white/95 shadow text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-50"><Edit3 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(entry)} className="p-2 bg-white/95 shadow text-red-700 rounded-lg border border-red-100 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
            </div>
            {entry.image ? (
              <div className="w-full aspect-video bg-zinc-100 overflow-hidden">
                <div className="h-full w-full min-w-0 min-h-0 flex items-center justify-center">
                  <img
                    src={entry.image}
                    alt={entry.species}
                    className="block h-full w-auto max-w-full object-contain object-center group-hover:scale-[1.02] transition-transform duration-700"
                  />
                </div>
              </div>
            ) : (
              <div className="w-full aspect-video bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                <Fish className="w-12 h-12 text-blue-200" />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-black text-zinc-900">{entry.weight}</span>
              </div>
              <h4 className="text-base font-black text-blue-700 mb-3">{entry.species}</h4>
              <div className="space-y-1 text-xs font-bold text-zinc-500">
                <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-400" />{entry.location}</p>
                {entry.date && <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-400" />{new Date(entry.date + 'T12:00').toLocaleDateString('es-CO')}</p>}
                {entry.bait && <p className="flex items-center gap-1.5"><Fish className="w-3.5 h-3.5 text-cyan-400" />{entry.bait}</p>}
              </div>
              {entry.notes && <p className="text-zinc-600 text-xs mt-3 leading-relaxed line-clamp-2">{entry.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BitacoraView
