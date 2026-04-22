import { useState } from 'react'
import {
  ArrowLeft, User, Calendar, PlusCircle, Edit3, Trash2, Newspaper, Sparkles, Loader2, UploadCloud,
} from 'lucide-react'
import { isAdminLike, requestPolishedText } from '../../shared/utils.js'
import { TENANT } from '../../tenant.config.js'
import { fetchGeminiDescriptionFromTitle, isGeminiConfigured, getLastGeminiDetail } from '../../geminiClient.js'
import {
  MAX_ENTITY_IMAGE_BYTES,
  MAX_ENTITY_IMAGE_SOURCE_BYTES,
  uploadEntityImageFile,
} from '../../firestore/uploadEntityImage.js'
import { ImageCropDialog } from '../../shared/ImageCropDialog.jsx'
import { extractYoutubeVideoId, youtubeWatchUrl } from '../../shared/youtube.js'
import { YoutubeEmbedBlock } from '../../shared/YoutubeEmbedBlock.jsx'
import { RichTextEditor } from '../../shared/RichTextEditor.jsx'
import { RichTextContent } from '../../shared/RichTextContent.jsx'
import {
  legacyPlainTextToHtml,
  stripHtmlToPlain,
  plainParagraphsToHtml,
  hasMeaningfulHtmlBody,
} from '../../shared/richText.js'
import { todayIsoDate, parseToIsoDate, displayPortalDate } from '../../shared/portalDates.js'

const CATEGORIES = ['General', 'Salidas', 'Torneo', 'Normativa', 'Charla', 'Mantenimiento', 'Proyectos']

const emptyForm = () => ({
  title: '',
  excerpt: '',
  content: '<p></p>',
  category: 'General',
  image: '',
  youtubeUrl: '',
  publicationDate: todayIsoDate(),
})

const NewsView = ({ currentUser, db, addNewsPost, updateNewsPost, deleteNewsPost, showAlert, showConfirm }) => {
  const [showForm, setShowForm] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imageCropSource, setImageCropSource] = useState(null)
  const [editorMountId, setEditorMountId] = useState(0)
  const aiEnabled = isGeminiConfigured()

  const bumpEditor = () => setEditorMountId((n) => n + 1)

  const openEdit = (post) => {
    setSelectedPost(null)
    setEditingId(post.id)
    const bodySource = post.content || post.excerpt || ''
    const htmlBody = post.bodyFormat === 'html'
      ? (post.content || '<p></p>')
      : legacyPlainTextToHtml(bodySource)
    setForm({
      title: post.title || '',
      excerpt: post.excerpt || '',
      content: htmlBody,
      category: post.category || 'General',
      image: post.image || '',
      youtubeUrl: post.youtubeVideoId ? youtubeWatchUrl(post.youtubeVideoId) : '',
      publicationDate: parseToIsoDate(post.date),
    })
    setImageFile(null)
    setImageCropSource(null)
    bumpEditor()
    setShowForm(true)
  }

  const requestDelete = (post) => {
    showConfirm(
      `¿Eliminar la noticia "${post.title}"? Esta acción no se puede deshacer.`,
      () => {
        deleteNewsPost(post.id)
          .then(() => {
            showAlert('Noticia eliminada.')
            setSelectedPost((p) => (p?.id === post.id ? null : p))
            setShowForm(false)
            setEditingId(null)
            setForm(emptyForm())
            setImageFile(null)
            setImageCropSource(null)
          })
          .catch(() => showAlert('No se pudo eliminar la noticia.'))
      },
    )
  }

  const handlePost = async (e) => {
    e.preventDefault()
    const isEditing = editingId != null
    const newsId = editingId ?? Date.now()
    const existing = isEditing ? (db.news || []).find((n) => n.id === editingId) : null

    if (!hasMeaningfulHtmlBody(form.content)) {
      showAlert('Escribe el contenido de la noticia en el editor.')
      return
    }

    const ytInput = form.youtubeUrl.trim()
    const youtubeVideoId = ytInput ? extractYoutubeVideoId(ytInput) : null
    if (ytInput && !youtubeVideoId) {
      showAlert('El enlace de YouTube no es válido. Pega una URL de youtube.com o youtu.be, o el ID del video (11 caracteres).')
      return
    }

    setSaving(true)
    try {
      const imageUrl = imageFile
        ? await uploadEntityImageFile(imageFile, 'news', newsId)
        : (form.image || null)
      const payload = {
        id: newsId,
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        category: form.category,
        image: imageUrl,
        author: existing?.author ?? currentUser.name,
        authorUsername: existing?.authorUsername ?? currentUser.username,
        date: form.publicationDate,
        bodyFormat: 'html',
      }
      if (youtubeVideoId) payload.youtubeVideoId = youtubeVideoId
      if (isEditing) await updateNewsPost(payload)
      else await addNewsPost(payload)
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm())
      setImageFile(null)
      setImageCropSource(null)
      showAlert(isEditing ? 'Noticia actualizada.' : '¡Noticia publicada en el muro!')
    } catch (err) {
      if (err instanceof Error && err.message === 'ENTITY_IMAGE_TOO_LARGE') {
        showAlert(`No pudimos reducir la foto lo suficiente (límite de subida ${Math.round(MAX_ENTITY_IMAGE_BYTES / 1024)} KB). Prueba con otra imagen.`)
      } else if (err instanceof Error && err.message === 'ENTITY_IMAGE_DECODE_FAILED') {
        showAlert('No se pudo procesar la imagen. Prueba con JPG o PNG.')
      } else if (err instanceof Error && err.message === 'ENTITY_IMAGE_STORAGE_UNAVAILABLE') {
        showAlert('La subida de imágenes no está disponible: revisa la configuración de Firebase.')
      } else {
        console.error(err)
        showAlert('No se pudo guardar la noticia.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleAiPolish = async () => {
    if (!form.title.trim() && !form.excerpt.trim() && !form.content.trim()) {
      return showAlert('Escribe título, resumen o contenido para usar sugerencias de IA.')
    }
    if (!isGeminiConfigured()) return showAlert('Configura VITE_GEMINI_API_KEY en .env para usar la IA.')
    setAiBusy(true)
    try {
      const plainBody = stripHtmlToPlain(form.content)
      const [title, excerpt, content] = await Promise.all([
        requestPolishedText('news_title', form.title),
        requestPolishedText('news_excerpt', form.excerpt),
        requestPolishedText('news_content', plainBody),
      ])
      setForm((prev) => {
        const nextPlain = (content && String(content).trim())
          ? String(content).trim()
          : stripHtmlToPlain(prev.content)
        return {
          ...prev,
          title: title || prev.title,
          excerpt: excerpt || prev.excerpt,
          content: plainParagraphsToHtml(nextPlain),
        }
      })
      bumpEditor()
      showAlert('Sugerencias de IA aplicadas. Revísalas antes de publicar.')
    } finally {
      setAiBusy(false)
    }
  }

  const handleDescriptionFromTitle = async () => {
    if (!form.title.trim()) return showAlert('Escribe el título primero.')
    if (!isGeminiConfigured()) return showAlert('Configura VITE_GEMINI_API_KEY en .env para usar la IA.')
    setAiBusy(true)
    try {
      const prevExcerpt = form.excerpt.trim()
      const res = await fetchGeminiDescriptionFromTitle(form.title, 'proposal')
      if (res?.description) {
        const nextExcerpt = String(res.description).trim()
        setForm((p) => ({ ...p, excerpt: res.description }))
        showAlert(nextExcerpt !== prevExcerpt
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

  if (selectedPost) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedPost(null)}
            className="flex items-center text-blue-700 font-bold hover:text-blue-800 bg-white px-4 py-2 rounded-xl shadow-sm w-fit"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Volver al muro de noticias
          </button>
          {isAdminLike(currentUser) && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openEdit(selectedPost)}
                className="inline-flex items-center bg-white border border-blue-200 text-blue-800 px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-blue-50"
              >
                <Edit3 className="w-4 h-4 mr-2" /> Editar
              </button>
              <button
                type="button"
                onClick={() => requestDelete(selectedPost)}
                className="inline-flex items-center bg-white border border-red-200 text-red-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
              </button>
            </div>
          )}
        </div>
        <article className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
          {selectedPost.image && (
            <div className="relative h-64 md:h-80 bg-zinc-100">
              <img src={selectedPost.image} alt={selectedPost.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 to-transparent" />
              <span className="absolute top-4 left-4 bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">
                {selectedPost.category}
              </span>
            </div>
          )}
          <div className="p-6 md:p-10">
            {!selectedPost.image && (
              <span className="inline-block bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest mb-4">
                {selectedPost.category}
              </span>
            )}
            <h2 className="text-3xl font-black text-zinc-900 mb-4 leading-tight">{selectedPost.title}</h2>
            <div className="flex items-center text-sm font-bold text-zinc-500 mb-6 gap-6 border-b border-zinc-100 pb-6">
              <span className="flex items-center"><User className="w-4 h-4 mr-2 text-blue-500" /> {selectedPost.author}</span>
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-blue-500" /> {displayPortalDate(selectedPost.date)}</span>
            </div>
            {selectedPost.youtubeVideoId ? (
              <YoutubeEmbedBlock videoId={selectedPost.youtubeVideoId} title={selectedPost.title} />
            ) : null}
            {selectedPost.bodyFormat === 'html' && hasMeaningfulHtmlBody(selectedPost.content) ? (
              <RichTextContent html={selectedPost.content} className="mb-2" />
            ) : (
              <div className="text-zinc-800 text-base leading-relaxed whitespace-pre-wrap">
                {selectedPost.content || selectedPost.excerpt}
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
        title="Recorta la foto de la noticia"
        onCancel={() => setImageCropSource(null)}
        onConfirm={(cropped) => {
          setImageFile(cropped)
          setImageCropSource(null)
          setForm((prev) => ({ ...prev, image: '' }))
        }}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900">Muro de Noticias</h2>
          <p className="text-zinc-500 mt-1">Novedades y comunicados del {TENANT.name}.</p>
        </div>
        {isAdminLike(currentUser) && (
          <button
            type="button"
            onClick={() => {
              if (showForm) { setShowForm(false); setEditingId(null); setForm(emptyForm()); setImageFile(null); setImageCropSource(null) }
              else { setEditingId(null); setForm(emptyForm()); setImageFile(null); setImageCropSource(null); bumpEditor(); setShowForm(true) }
            }}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold flex items-center shadow-sm hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancelar' : <><PlusCircle className="w-5 h-5 mr-2" /> Publicar Noticia</>}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white/85 backdrop-blur p-8 rounded-3xl border border-blue-100/40 shadow-md space-y-6 animate-in slide-in-from-top-4">
          <h3 className="text-xl font-bold flex items-center">
            <Newspaper className="mr-2 text-blue-600" />
            {editingId != null ? 'Editar Noticia' : 'Redactar Nueva Noticia'}
          </h3>
          {aiEnabled && <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3">
            <button
              type="button"
              onClick={() => void handleAiPolish()}
              disabled={aiBusy}
              className="inline-flex items-center rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-800 hover:bg-amber-100 disabled:opacity-60"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
              {aiBusy ? 'Procesando…' : 'Mejorar lo que escribí (IA)'}
            </button>
            <button
              type="button"
              onClick={() => void handleDescriptionFromTitle()}
              disabled={aiBusy}
              className="inline-flex items-center rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-50 disabled:opacity-60"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
              Descripción desde el título
            </button>
            <p className="text-xs text-zinc-600">Mejorar pulirá título y texto si ya los tienes. Descripción desde el título rellena o sustituye el texto según el título; revísala siempre antes de enviar.</p>
          </div>}
          <form onSubmit={handlePost} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-zinc-800 mb-1.5">Título *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full p-4 border rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-zinc-800 mb-1.5">Categoría</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full p-4 border rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-800 mb-1.5">Foto (opcional)</label>
                <label className="w-full p-4 border rounded-xl bg-zinc-50 outline-none focus-within:ring-2 focus-within:ring-blue-500 font-medium flex items-center gap-2 cursor-pointer">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-zinc-700 truncate">
                    {imageFile ? imageFile.name : 'Subir desde tu dispositivo'}
                  </span>
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
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-800 mb-1.5">Resumen corto *</label>
              <textarea
                required
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="w-full p-4 border rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 h-20"
                placeholder="Aparece en la tarjeta del muro..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-800 mb-1.5">Fecha de publicación *</label>
              <input
                required
                type="date"
                value={form.publicationDate}
                onChange={(e) => setForm({ ...form, publicationDate: e.target.value })}
                className="w-full p-4 border rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-800 mb-1.5">Contenido completo *</label>
              <p className="text-xs text-zinc-500 mb-2">Usa la barra para negritas, títulos, listas, tablas y videos de YouTube dentro del texto.</p>
              <RichTextEditor
                key={editorMountId}
                initialHtml={form.content}
                onChange={(html) => setForm((p) => ({ ...p, content: html }))}
                disabled={saving}
                placeholder="Redacta el artículo: secciones, listas, tablas técnicas, enlaces…"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-800 mb-1.5">Video de YouTube (opcional)</label>
              <input
                type="text"
                inputMode="url"
                value={form.youtubeUrl}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                className="w-full p-4 border rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.youtube.com/watch?v=… o youtu.be/…"
              />
              <p className="mt-1.5 text-xs text-zinc-500">Si lo completas, el video aparecerá embebido arriba del texto en la noticia publicada.</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white p-4 rounded-xl font-black flex justify-center items-center disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              {saving ? <><Loader2 className="animate-spin mr-2" /> Guardando...</> : editingId != null ? 'Guardar cambios' : 'Publicar Noticia'}
            </button>
          </form>
        </div>
      )}

      {(db.news || []).length === 0 && !showForm && (
        <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/40 px-6 py-12 text-center">
          <Newspaper className="w-12 h-12 text-blue-400 mx-auto mb-4 opacity-80" />
          <p className="text-zinc-800 font-bold text-lg mb-1">Aún no hay noticias</p>
          <p className="text-zinc-500 text-sm">Cuando publiquen comunicados en el portal, aparecerán aquí.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(db.news || []).map((post) => (
          <article
            key={post.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedPost(post)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPost(post) } }}
            className="relative bg-white/85 backdrop-blur rounded-3xl overflow-hidden border border-zinc-100 shadow-sm flex flex-col group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            {isAdminLike(currentUser) && (
              <div
                className="absolute top-3 right-3 z-20 flex gap-1.5"
                onClick={(e) => e.stopPropagation()}
                role="presentation"
              >
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openEdit(post) }}
                  className="bg-white/95 text-blue-800 p-2 rounded-lg shadow-md border border-blue-100 hover:bg-blue-50"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); requestDelete(post) }}
                  className="bg-white/95 text-red-700 p-2 rounded-lg shadow-md border border-red-100 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="aspect-video relative overflow-hidden bg-zinc-100">
              {post.image ? (
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
                  <Newspaper className="w-16 h-16 text-blue-200" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
              <span className="absolute top-4 left-4 bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">
                {post.category}
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-lg font-black text-zinc-900 mb-2 leading-tight group-hover:text-blue-700 transition-colors">
                {post.title}
              </h3>
              <p className="text-zinc-600 text-sm mb-4 flex-1 line-clamp-3">{post.excerpt}</p>
              <div className="pt-3 border-t border-zinc-100 flex justify-between items-center text-xs font-bold text-zinc-400 uppercase tracking-widest">
                <span className="flex items-center"><User className="w-3.5 h-3.5 mr-1.5" /> {post.author}</span>
                <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1.5" /> {displayPortalDate(post.date)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default NewsView
