import { useMemo, useState } from 'react'
import {
  PlusCircle, Droplets, User, MapPin, Edit3, Trash2, Loader2, Fish, UploadCloud, Filter,
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
import { isPublicOnClubWall, recordShownInRecordsGrid } from '../../shared/recordVisibility.js'

const emptyForm = () => ({
  species: defaultRecordSpeciesSelect(),
  location: '',
  image: '',
  clubVisible: true,
})

const LaganaWallView = ({ currentUser, db, saveLaganaWallPost, deleteLaganaWallPost, logAction, showAlert, showConfirm }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imageCropSource, setImageCropSource] = useState(null)
  const [filterSpecies, setFilterSpecies] = useState('')
  const canManage = isAdminLike(currentUser)
  const isGuestUser = isGuest(currentUser)

  const postsList = db.laganaWallPosts || []

  const speciesFilterOptions = useMemo(() => {
    const catalog = RECORD_SPECIES_OPTIONS.filter((s) => s !== 'Otra')
    const canonicalByLower = new Map(catalog.map((s) => [s.toLocaleLowerCase('es'), s]))
    const seen = new Set()
    const out = []
    for (const s of catalog) {
      const k = s.toLocaleLowerCase('es')
      if (seen.has(k)) continue
      seen.add(k)
      out.push(s)
    }
    for (const p of postsList) {
      const raw = String(p?.species ?? '').trim()
      if (!raw) continue
      const key = raw.toLocaleLowerCase('es')
      if (seen.has(key)) continue
      seen.add(key)
      out.push(canonicalByLower.get(key) || raw)
    }
    return out.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
  }, [postsList])

  const visibilityFiltered = useMemo(
    () => postsList.filter((p) => recordShownInRecordsGrid(p, currentUser, canManage)),
    [postsList, currentUser, canManage],
  )

  const filteredPosts = useMemo(() => {
    let list = [...visibilityFiltered]
    if (filterSpecies) list = list.filter((p) => p.species === filterSpecies)
    return list
  }, [visibilityFiltered, filterSpecies])

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm())
    setImageFile(null)
    setImageCropSource(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const loc = String(form.location ?? '').trim()
    if (!loc) return showAlert('El lugar es obligatorio.')

    const isEditing = editingId != null
    const recordId = isEditing ? editingId : Date.now()
    const prevForMerge = isEditing ? postsList.find((p) => String(p.id) === String(editingId)) : null

    setSaving(true)
    try {
      const imageUrl = imageFile
        ? await uploadEntityImageFile(imageFile, 'laganaWallPosts', recordId)
        : (form.image || prevForMerge?.image || null)
      const post = {
        ...(prevForMerge || {}),
        id: recordId,
        species: form.species,
        location: loc,
        date: prevForMerge?.date || new Date().toISOString().split('T')[0],
        image: imageUrl,
        angler: prevForMerge?.angler ?? currentUser.name,
        anglerUsername: prevForMerge?.anglerUsername ?? currentUser.username,
        clubVisible: form.clubVisible === false ? false : true,
        adminSuppressed: prevForMerge?.adminSuppressed === true,
      }
      await saveLaganaWallPost(post)
      logAction?.(isEditing ? 'EDITAR_MURO_LAGANA' : 'NUEVO_MURO_LAGANA', `${post.species} · ${post.location}`)
      resetForm()
      showAlert(isEditing ? 'Entrada actualizada.' : '¡Tu lagaña quedó en el muro!')
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
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (post) => {
    showConfirm(`¿Quitar esta entrada del muro (${post.species})?`, async () => {
      try {
        await deleteLaganaWallPost(post.id)
        logAction?.('ELIMINAR_MURO_LAGANA', post.species)
        showAlert('Entrada eliminada.')
      } catch {
        showAlert('No se pudo eliminar.')
      }
    })
  }

  const handleToggleClubVisibility = async (post) => {
    if (post.adminSuppressed) {
      showAlert('Un administrador retiró esta publicación del muro. Escribe a los administradores del portal si crees que fue un error.')
      return
    }
    const next = !(post.clubVisible !== false)
    try {
      await saveLaganaWallPost({ ...post, clubVisible: next })
      logAction?.(next ? 'LAGANA_VISIBLE_CLUB' : 'LAGANA_OCULTO_CLUB', String(post.id))
    } catch {
      showAlert('No se pudo actualizar la visibilidad.')
    }
  }

  const handleAdminSuppress = (post) => {
    showConfirm(
      '¿Retirar esta entrada del muro por moderación? Dejará de verse para quienes navegan hasta que un administrador la restaure.',
      async () => {
        try {
          await saveLaganaWallPost({ ...post, adminSuppressed: true })
          logAction?.('LAGANA_MODERACION_OCULTAR', String(post.id))
          showAlert('Entrada retirada del muro público.')
        } catch {
          showAlert('No se pudo aplicar la moderación.')
        }
      },
    )
  }

  const handleAdminRestore = (post) => {
    showConfirm(
      '¿Quitar el retiro por moderación? Si quien publicó la dejó como visible, volverá al muro para todos.',
      async () => {
        try {
          await saveLaganaWallPost({ ...post, adminSuppressed: false })
          logAction?.('LAGANA_MODERACION_RESTAURAR', String(post.id))
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
        title="Recorta la foto (opcional)"
        onCancel={() => setImageCropSource(null)}
        onConfirm={(cropped) => {
          setImageFile(cropped)
          setImageCropSource(null)
          setForm((prev) => ({ ...prev, image: '' }))
        }}
      />
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-black text-zinc-900 flex items-center gap-2 flex-wrap">
            <Droplets className="w-8 h-8 text-sky-500 shrink-0" />
            Muro de las Lagañas
          </h2>
          <p className="text-zinc-500 mt-1 max-w-3xl leading-relaxed">
            El rincón del <span className="font-bold text-zinc-700">pez más chiquito</span> que sacaste: sin peso ni medida, solo la especie y el lugar
            (y si quieres, una foto para reírse con cariño). Nada de competir: es humor de club.
          </p>
        </div>
        {!isGuestUser && (
          <button
            type="button"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true) }}
            className="bg-sky-500 text-white px-5 py-3 rounded-xl font-black flex items-center justify-center shadow-sm hover:bg-sky-400 transition-colors shrink-0 self-start md:pt-1"
          >
            {showForm ? 'Cancelar' : <><PlusCircle className="w-5 h-5 mr-2" /> Registrar lagaña</>}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-sky-200 shadow-md animate-in slide-in-from-top-4">
          <h3 className="text-xl font-black mb-5 text-sky-950 flex items-center">
            <Droplets className="w-6 h-6 mr-2 text-sky-500" /> {editingId ? 'Editar entrada' : 'Nueva lagaña'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Especie *</label>
                <select value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-sky-500 font-medium">
                  {RECORD_SPECIES_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Lugar *</label>
                <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ej: Charco de la esquina, represa…" className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-zinc-700 mb-1">Foto (opcional)</label>
                <label className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus-within:ring-2 focus-within:ring-sky-500 flex items-center gap-2 cursor-pointer">
                  <UploadCloud className="w-4 h-4 text-sky-600" />
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
                  Si subes foto, es solo por el meme; no hace falta medir ni pesar al bichito.
                </p>
              </div>
              <div className="md:col-span-2 flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
                <input
                  id="lagana-muro-visible"
                  type="checkbox"
                  checked={form.clubVisible !== false}
                  onChange={(e) => setForm({ ...form, clubVisible: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="lagana-muro-visible" className="text-sm font-medium text-zinc-700 leading-snug cursor-pointer">
                  <span className="font-bold text-zinc-900">Mostrar en el muro público del portal</span>
                  <span className="block text-zinc-500 text-xs mt-1 font-normal">
                    Si lo desmarcas, la entrada queda guardada pero solo tú (y moderación) la verán aquí.
                  </span>
                </label>
              </div>
            </div>
            <button type="submit" disabled={saving} className="bg-sky-600 text-white px-8 py-3 rounded-xl font-black hover:bg-sky-500 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Publicar en el muro'}
            </button>
          </form>
        </div>
      )}

      {postsList.length === 0 && !showForm && (
        <div className="rounded-3xl border border-dashed border-sky-200 bg-sky-50/40 px-6 py-12 text-center">
          <Droplets className="w-12 h-12 text-sky-400 mx-auto mb-4" />
          <p className="text-zinc-800 font-bold text-lg mb-1">Todavía no hay lagañas en el muro</p>
          <p className="text-zinc-500 text-sm">¡Sé el primero en confesar esa micro-captura!</p>
        </div>
      )}

      {postsList.length > 0 && visibilityFiltered.length === 0 && !showForm && (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
          <p className="text-zinc-800 font-bold mb-1">No hay entradas visibles en el muro</p>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">
            {isGuestUser
              ? 'Quienes tienen cuenta pueden publicar y elegir si se muestran a todos. Vuelve más tarde o solicita acceso.'
              : 'Si ocultaste las tuyas o un administrador retiró alguna por moderación, aquí no aparecerán hasta que se restauren.'}
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
              <div className="flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-zinc-600" aria-hidden>
                <Filter className="w-4 h-4 shrink-0 text-sky-600" />
              </div>
            </div>
            <div className="min-w-0 flex-1 sm:min-w-[160px] flex flex-col gap-1">
              <label htmlFor="lagana-filter-species" className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 leading-none min-h-[14px] flex items-end">
                Especie
              </label>
              <select
                id="lagana-filter-species"
                value={filterSpecies}
                onChange={(e) => setFilterSpecies(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold text-zinc-800 outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Todas las especies</option>
                {speciesFilterOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {filterSpecies && (
              <div className="flex flex-col gap-1 shrink-0 sm:min-w-[8.5rem]">
                <span className="min-h-[14px] text-[10px] font-bold uppercase leading-none invisible select-none" aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setFilterSpecies('')}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-600 hover:bg-zinc-50 sm:w-auto sm:whitespace-nowrap"
                >
                  Limpiar filtro
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {visibilityFiltered.length > 0 && filteredPosts.length === 0 && !showForm && (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
          <p className="text-zinc-800 font-bold mb-1">Ninguna entrada coincide con el filtro</p>
          <p className="text-zinc-500 text-sm">Prueba otra especie o limpia el filtro.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPosts.map((post) => {
          const isOwner = currentUser.username === post.anglerUsername
          const canEdit = (isOwner || canManage) && !isGuestUser
          const hasVisibilityBanner = post.adminSuppressed || !isPublicOnClubWall(post)
          return (
            <div key={post.id} className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden relative group hover:shadow-md transition-all">
              {post.adminSuppressed && (
                <div className="px-3 py-2 text-xs font-black uppercase tracking-wide bg-rose-100 text-rose-900 border-b border-rose-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  Retirada del muro por moderación
                </div>
              )}
              {!post.adminSuppressed && !isPublicOnClubWall(post) && (
                <div className="px-3 py-2 text-xs font-bold bg-zinc-100 text-zinc-700 border-b border-zinc-200">
                  {isOwner ? 'Oculta para el resto (solo tú y moderación la ven aquí)' : 'Quien publicó la ocultó del muro público'}
                </div>
              )}
              {canEdit && (
                <div className={`absolute right-3 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10 ${hasVisibilityBanner ? 'top-14' : 'top-3'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        species: post.species,
                        location: post.location || '',
                        image: post.image || '',
                        clubVisible: post.clubVisible !== false,
                      })
                      setImageFile(null)
                      setImageCropSource(null)
                      setEditingId(post.id)
                      setShowForm(true)
                    }}
                    className="p-2 bg-white/95 shadow text-sky-700 rounded-lg border border-sky-100 hover:bg-sky-50"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => handleDelete(post)} className="p-2 bg-white/95 shadow text-red-700 rounded-lg border border-red-100 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
              {post.image ? (
                <div className="w-full aspect-video bg-zinc-100 overflow-hidden">
                  <div className="h-full w-full min-w-0 min-h-0 flex items-center justify-center">
                    <img
                      src={post.image}
                      alt={post.species}
                      className="block h-full w-auto max-w-full object-contain object-center group-hover:scale-[1.02] transition-transform duration-700"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-sky-50 to-indigo-50 flex items-center justify-center">
                  <Fish className="w-16 h-16 text-sky-200" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-5 h-5 text-sky-500 shrink-0" />
                  <span className="text-sm font-black uppercase tracking-wide text-sky-700">Lagaña</span>
                </div>
                <h4 className="text-lg font-black text-sky-900 mb-2">{post.species}</h4>
                <div className="space-y-1 text-xs font-bold text-zinc-500">
                  <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />{post.location}</p>
                  <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-sky-400 shrink-0" />{post.angler} {isOwner && !isGuestUser && '(Tú)'}</p>
                </div>
                {isOwner && !isGuestUser && (
                  <div className="mt-4 pt-3 border-t border-zinc-100">
                    <button
                      type="button"
                      disabled={Boolean(post.adminSuppressed)}
                      onClick={() => void handleToggleClubVisibility(post)}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black border transition-colors ${
                        post.adminSuppressed
                          ? 'border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed'
                          : post.clubVisible !== false
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                            : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      {post.clubVisible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {post.clubVisible !== false ? 'Visible en el muro público' : 'Oculta del muro (solo tú y moderación)'}
                    </button>
                  </div>
                )}
                {canManage && (
                  <div className="mt-3 pt-3 border-t border-sky-100/80">
                    {!post.adminSuppressed ? (
                      <button
                        type="button"
                        onClick={() => handleAdminSuppress(post)}
                        className="w-full py-2 rounded-xl text-xs font-black border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
                      >
                        Retirar del muro (moderación)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAdminRestore(post)}
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

export default LaganaWallView
