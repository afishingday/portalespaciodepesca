import { useState } from 'react'
import { PlusCircle, Video, User, Calendar, Edit3, Trash2, Loader2, Sparkles, ArrowLeft } from 'lucide-react'
import { isAdminLike, requestPolishedText } from '../../shared/utils.js'
import { fetchGeminiDescriptionFromTitle, isGeminiConfigured, getLastGeminiDetail } from '../../geminiClient.js'
import { extractYoutubeVideoId, youtubeWatchUrl } from '../../shared/youtube.js'
import { YoutubeEmbedBlock } from '../../shared/YoutubeEmbedBlock.jsx'
import { RichTextEditor } from '../../shared/RichTextEditor.jsx'
import { RichTextContent } from '../../shared/RichTextContent.jsx'
import { legacyPlainTextToHtml, hasMeaningfulHtmlBody } from '../../shared/richText.js'
import { todayIsoDate, parseToIsoDate, displayPortalDate } from '../../shared/portalDates.js'

const emptyForm = () => ({
  title: '',
  excerpt: '',
  content: '<p></p>',
  date: todayIsoDate(),
  youtubeUrl: '',
})

const talkToForm = (talk) => ({
  title: talk.title || '',
  excerpt: talk.excerpt || '',
  content: talk.bodyFormat === 'html' ? (talk.content || '<p></p>') : legacyPlainTextToHtml(talk.content || ''),
  date: parseToIsoDate(talk.date),
  youtubeUrl: talk.youtubeVideoId ? youtubeWatchUrl(talk.youtubeVideoId) : '',
})

const TalksView = ({ currentUser, db, saveTalk, deleteTalk, logAction, showAlert, showConfirm }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editorMountId, setEditorMountId] = useState(0)
  const canManage = isAdminLike(currentUser)
  const aiEnabled = isGeminiConfigured()

  const bumpEditor = () => setEditorMountId((n) => n + 1)

  const resetForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm()) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ytInput = form.youtubeUrl.trim()
    const youtubeVideoId = ytInput ? extractYoutubeVideoId(ytInput) : null
    if (ytInput && !youtubeVideoId) {
      showAlert('El enlace de YouTube no es válido. Pega una URL de youtube.com o youtu.be, o el ID del video (11 caracteres).')
      return
    }
    setSaving(true)
    try {
      const isEditing = editingId != null
      const prev = isEditing ? (db.talks || []).find((t) => t.id === editingId) : null
      const next = {
        ...(prev || {}),
        id: editingId || Date.now(),
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        date: form.date,
        author: prev?.author ?? currentUser.name,
        authorUsername: prev?.authorUsername ?? currentUser.username,
      }
      if (youtubeVideoId) next.youtubeVideoId = youtubeVideoId
      else delete next.youtubeVideoId
      next.bodyFormat = 'html'
      await saveTalk(next)
      logAction?.(isEditing ? 'EDITAR_CHARLA' : 'NUEVA_CHARLA', form.title)
      resetForm()
      showAlert(isEditing ? 'Charla actualizada.' : 'Charla publicada.')
    } catch { showAlert('No se pudo guardar.') } finally { setSaving(false) }
  }

  const handleDelete = (talk) => {
    showConfirm(`¿Eliminar la charla "${talk.title}"?`, async () => {
      try { await deleteTalk(talk.id); logAction?.('ELIMINAR_CHARLA', talk.title); showAlert('Charla eliminada.') }
      catch { showAlert('No se pudo eliminar.') }
    })
  }

  const handleAiExcerpt = async () => {
    if (!form.title.trim()) return showAlert('Escribe el título primero.')
    if (!isGeminiConfigured()) return showAlert('Configura VITE_GEMINI_API_KEY en .env.')
    setAiBusy(true)
    try {
      const res = await fetchGeminiDescriptionFromTitle(form.title, 'talk')
      if (res?.description) { setForm((p) => ({ ...p, excerpt: res.description })); showAlert('Resumen sugerido desde el título.') }
      else showAlert(getLastGeminiDetail() || 'La IA no respondió.')
    } catch { showAlert('Error al contactar la IA.') } finally { setAiBusy(false) }
  }

  const handleAiPolish = async () => {
    if (!form.title.trim() && !form.excerpt.trim()) {
      return showAlert('Escribe título o resumen para usar la IA.')
    }
    if (!isGeminiConfigured()) return showAlert('Configura VITE_GEMINI_API_KEY en .env.')
    setAiBusy(true)
    try {
      const prevTitle = form.title.trim()
      const prevExcerpt = form.excerpt.trim()
      const [title, excerpt] = await Promise.all([
        requestPolishedText('talk_title', form.title),
        requestPolishedText('talk_excerpt', form.excerpt),
      ])
      const nextTitle = (title || form.title).trim()
      const nextExcerpt = (excerpt || form.excerpt).trim()
      const changed = nextTitle !== prevTitle || nextExcerpt !== prevExcerpt
      setForm((p) => ({
        ...p,
        title: title || p.title,
        excerpt: excerpt || p.excerpt,
      }))
      showAlert(changed ? 'Texto de la charla mejorado con IA. Revísalo antes de publicar.' : 'La IA respondió, pero no encontró cambios relevantes para mejorar.')
    } catch { showAlert('Error al contactar la IA.') } finally { setAiBusy(false) }
  }

  if (selected) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setSelected(null)} className="flex items-center text-blue-700 font-bold hover:text-blue-800 bg-white px-4 py-2 rounded-xl shadow-sm">
            <ArrowLeft className="w-5 h-5 mr-2" /> Volver a Charlas
          </button>
          {canManage && (
            <div className="flex gap-2">
              <button type="button" onClick={() => { setForm(talkToForm(selected)); setEditingId(selected.id); bumpEditor(); setShowForm(true); setSelected(null) }} className="inline-flex items-center bg-white border border-blue-200 text-blue-800 px-3 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-blue-50"><Edit3 className="w-4 h-4 mr-1.5" /> Editar</button>
              <button type="button" onClick={() => handleDelete(selected)} className="inline-flex items-center bg-white border border-red-200 text-red-700 px-3 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-red-50"><Trash2 className="w-4 h-4 mr-1.5" /> Eliminar</button>
            </div>
          )}
        </div>
        <article className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 md:p-10">
          <div className="flex items-center gap-2 mb-4">
            <Video className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-black uppercase tracking-widest text-blue-600">Charla</span>
          </div>
          <h2 className="text-3xl font-black text-zinc-900 mb-4 leading-tight">{selected.title}</h2>
          <div className="flex items-center text-sm font-bold text-zinc-500 mb-6 gap-5 border-b border-zinc-100 pb-5">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-blue-500" />{selected.author}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-500" />{displayPortalDate(selected.date)}</span>
          </div>
          {selected.youtubeVideoId ? (
            <YoutubeEmbedBlock videoId={selected.youtubeVideoId} title={selected.title} />
          ) : null}
          {selected.bodyFormat === 'html' && hasMeaningfulHtmlBody(selected.content) ? (
            <RichTextContent html={selected.content} className="mb-2" />
          ) : (
            <div className="text-zinc-800 text-base leading-relaxed whitespace-pre-wrap">{selected.content || selected.excerpt}</div>
          )}
        </article>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900">Charlas y Tips</h2>
          <p className="text-zinc-500 mt-1">Resúmenes de charlas, técnicas y conocimiento compartido.</p>
        </div>
        {canManage && (
          <button type="button" onClick={() => { if (showForm) resetForm(); else { setEditingId(null); setForm(emptyForm()); bumpEditor(); setShowForm(true) } }} className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold flex items-center shadow-sm hover:bg-blue-700 transition-colors">
            {showForm ? 'Cancelar' : <><PlusCircle className="w-5 h-5 mr-2" /> Nueva Charla</>}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-blue-100 shadow-md animate-in slide-in-from-top-4">
          <h3 className="text-xl font-black mb-4 flex items-center text-blue-900"><Video className="w-5 h-5 mr-2 text-blue-500" />{editingId ? 'Editar Charla' : 'Nueva Charla'}</h3>
          {aiEnabled && <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 mb-4">
            <button type="button" onClick={() => void handleAiPolish()} disabled={aiBusy} className="inline-flex items-center rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-800 hover:bg-amber-100 disabled:opacity-60">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> {aiBusy ? 'Procesando…' : 'Mejorar lo que escribí (IA)'}
            </button>
            <button type="button" onClick={() => void handleAiExcerpt()} disabled={aiBusy} className="inline-flex items-center rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-50 disabled:opacity-60">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> Descripción desde el título
            </button>
            <p className="text-xs text-zinc-600">Mejorar pulirá título y texto si ya los tienes. Descripción desde el título rellena o sustituye el texto según el título; revísala siempre antes de enviar.</p>
          </div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Título *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Mantenimiento de Carretes y Cañas" className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Resumen corto *</label>
              <textarea required value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 h-20" placeholder="Qué se aprendió y por qué es relevante para quienes participan en el portal..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Contenido completo</label>
              <p className="text-xs text-zinc-500 mb-2">Títulos de sección, listas, tablas técnicas, enlaces y YouTube embebido.</p>
              <RichTextEditor
                key={editorMountId}
                initialHtml={form.content}
                onChange={(html) => setForm((p) => ({ ...p, content: html }))}
                disabled={saving}
                placeholder="Detalla los puntos clave, técnicas, materiales, tablas de equipo…"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Video de YouTube (opcional)</label>
              <input
                type="text"
                inputMode="url"
                value={form.youtubeUrl}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.youtube.com/watch?v=… o youtu.be/…"
              />
              <p className="mt-1 text-xs text-zinc-500">Si lo completas, el reproductor aparecerá en la charla publicada, encima del texto.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Fecha *</label>
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Publicar Charla'}
            </button>
          </form>
        </div>
      )}

      {(db.talks || []).length === 0 && !showForm && (
        <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/40 px-6 py-12 text-center">
          <Video className="w-12 h-12 text-blue-300 mx-auto mb-4" />
          <p className="text-zinc-800 font-bold text-lg mb-1">No hay charlas registradas</p>
          <p className="text-zinc-500 text-sm">Los resúmenes de charlas y tips aparecerán aquí.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(db.talks || []).map((talk) => (
          <article
            key={talk.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelected(talk)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(talk) } }}
            className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 flex flex-col group cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all relative"
          >
            {canManage && (
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()} role="presentation">
                <button onClick={(e) => { e.stopPropagation(); setForm(talkToForm(talk)); setEditingId(talk.id); bumpEditor(); setShowForm(true) }} className="p-2 bg-zinc-50 hover:bg-blue-50 text-blue-600 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(talk) }} className="p-2 bg-zinc-50 hover:bg-red-50 text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <Video className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Charla</span>
            </div>
            <h4 className="text-lg font-black text-zinc-900 mb-2 leading-tight group-hover:text-blue-700 transition-colors pr-16">{talk.title}</h4>
            <p className="text-zinc-600 text-sm flex-1 line-clamp-3">{talk.excerpt}</p>
            <div className="pt-4 mt-4 border-t border-zinc-100 flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-blue-400" />{talk.author}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-blue-400" />{displayPortalDate(talk.date)}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default TalksView
