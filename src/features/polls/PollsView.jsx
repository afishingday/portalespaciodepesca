import { useState } from 'react'
import {
  PlusCircle, Sparkles, Edit3, Trash2, BarChart2, CheckSquare, Lock, Check, User, ChevronDown,
} from 'lucide-react'
import {
  isAdminLike, isGuest, isVotingClosed, safeDateParse, getTimeRemainingLabel,
  coerceSurveyOptionId, requestPolishedText,
} from '../../shared/utils.js'
import { fetchGeminiSurveyOptions, fetchGeminiDescriptionFromTitle, isGeminiConfigured, getLastGeminiDetail } from '../../geminiClient.js'

const GuestBanner = ({ onRegisterRequest }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-5 mb-6 shadow-sm">
    <div className="flex items-center gap-4">
      <div className="bg-blue-100 p-3 rounded-full shrink-0"><Lock className="w-6 h-6 text-blue-600" /></div>
      <div>
        <h4 className="font-black text-blue-900">Exclusiva para cuentas registradas</h4>
        <p className="text-sm text-blue-700 font-medium">Solicita acceso para votar en las encuestas de la comunidad.</p>
      </div>
    </div>
    <button onClick={onRegisterRequest} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black text-sm transition-colors shadow-md w-full md:w-auto">
      Solicitar Acceso
    </button>
  </div>
)

const emptyForm = () => ({
  title: '', excerpt: '', question: '', deadline: '',
  options: [{ id: 1, text: '' }, { id: 2, text: '' }],
})

const PollsView = ({ currentUser, db, savePoll, deletePoll, logAction, showAlert, showConfirm, onRegisterRequest }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [selectedOptions, setSelectedOptions] = useState({})
  /** `${pollId}::${optionId}` → lista de votantes expandida */
  const [voterListOpen, setVoterListOpen] = useState({})
  const [aiBusy, setAiBusy] = useState(false)
  const [saving, setSaving] = useState(false)

  const isGuestUser = isGuest(currentUser)
  const canManage = isAdminLike(currentUser)
  const aiEnabled = isGeminiConfigured()

  const voterListKey = (pollId, optionId) => `${pollId}::${String(optionId)}`

  const resolveVoterDisplayName = (username) => {
    const u = (db.users || []).find((x) => x.username === username)
    return u?.name || username
  }

  const resetForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm()) }

  const handleVote = async (pollId) => {
    const poll = db.polls?.find((p) => p.id === pollId)
    if (!poll) return
    if (isVotingClosed(poll)) return showAlert('Esta votación ya está cerrada.')
    const optionId = selectedOptions[pollId]
    if (!optionId) return showAlert('Selecciona una opción antes de votar.')

    const coerced = coerceSurveyOptionId(poll.survey?.options, optionId)
    let newVotes = [...(poll.survey?.votes || [])]
    const idx = newVotes.findIndex((v) => v.username === currentUser.username)
    const voteEntry = { username: currentUser.username, optionId: coerced, timestamp: new Date().toLocaleTimeString('es-CO') }
    if (idx >= 0) newVotes[idx] = voteEntry
    else newVotes.push(voteEntry)

    try {
      await savePoll({ ...poll, survey: { ...poll.survey, votes: newVotes } })
      logAction?.('VOTAR', `Votó en encuesta: ${poll.title}`)
      showAlert('Tu voto ha sido registrado.')
    } catch { showAlert('No se pudo registrar el voto.') }
  }

  const handleAiSuggestOptions = async () => {
    if (!form.question.trim()) return showAlert('Escribe la pregunta primero.')
    if (!isGeminiConfigured()) return showAlert('Configura VITE_GEMINI_API_KEY en .env.')
    setAiBusy(true)
    try {
      const prevOptions = form.options.map((o) => String(o.text || '').trim()).filter(Boolean)
      const res = await fetchGeminiSurveyOptions(form.question)
      if (res?.suggestedOptions?.length > 0) {
        const nextOptions = res.suggestedOptions.map((o) => String(o || '').trim()).filter(Boolean)
        const changed = nextOptions.join('||') !== prevOptions.join('||')
        setForm((p) => ({ ...p, options: res.suggestedOptions.map((o, i) => ({ id: Date.now() + i, text: o })) }))
        showAlert(changed ? 'Opciones sugeridas por IA. Revísalas antes de publicar.' : 'La IA respondió, pero las opciones quedaron iguales.')
      } else { showAlert(getLastGeminiDetail() || 'La IA no pudo generar opciones. Agrégalas manualmente.') }
    } catch { showAlert('Error al contactar la IA.') } finally { setAiBusy(false) }
  }

  const handleAiPolish = async () => {
    if (!form.title.trim() && !form.excerpt.trim() && !form.question.trim()) {
      return showAlert('Escribe título, contexto o pregunta para usar la IA.')
    }
    if (!isGeminiConfigured()) return showAlert('Configura VITE_GEMINI_API_KEY en .env para usar la IA.')
    setAiBusy(true)
    try {
      const prevTitle = form.title.trim()
      const prevExcerpt = form.excerpt.trim()
      const prevQuestion = form.question.trim()
      const [title, excerpt, question] = await Promise.all([
        requestPolishedText('poll_title', form.title),
        requestPolishedText('poll_excerpt', form.excerpt),
        requestPolishedText('poll_question', form.question),
      ])
      const nextTitle = (title || form.title).trim()
      const nextExcerpt = (excerpt || form.excerpt).trim()
      const nextQuestion = (question || form.question).trim()
      const changed =
        nextTitle !== prevTitle ||
        nextExcerpt !== prevExcerpt ||
        nextQuestion !== prevQuestion
      setForm((prev) => ({
        ...prev,
        title: title || prev.title,
        excerpt: excerpt || prev.excerpt,
        question: question || prev.question,
      }))
      showAlert(changed ? 'Texto de la votación mejorado con IA. Revísalo antes de publicar.' : 'La IA respondió, pero no encontró cambios relevantes para mejorar.')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validOptions = form.options.filter((o) => o.text.trim() !== '')
    if (validOptions.length < 2) return showAlert('Agrega al menos 2 opciones de respuesta.')
    if (!form.deadline) return showAlert('Selecciona una fecha de cierre.')
    setSaving(true)
    try {
      const isEditing = editingId != null
      const prev = isEditing ? (db.polls || []).find((p) => p.id === editingId) : null
      const poll = {
        ...(prev || {}),
        id: editingId || Date.now(),
        title: form.title,
        excerpt: form.excerpt,
        deadline: form.deadline,
        author: prev?.author ?? currentUser.name,
        authorUsername: prev?.authorUsername ?? currentUser.username,
        date: prev?.date ?? new Date().toLocaleDateString('es-CO'),
        survey: {
          ...(prev?.survey || {}),
          question: form.question,
          options: validOptions.map((o, i) => ({ id: `opt${i}`, text: o.text })),
          votes: prev?.survey?.votes || [],
        },
      }
      await savePoll(poll)
      logAction?.(isEditing ? 'EDITAR_VOTACION' : 'NUEVA_VOTACION', poll.title)
      resetForm()
      showAlert(isEditing ? 'Votación actualizada.' : 'Votación publicada.')
    } catch { showAlert('No se pudo guardar la votación.') } finally { setSaving(false) }
  }

  const startEdit = (poll) => {
    setForm({
      title: poll.title,
      excerpt: poll.excerpt || '',
      question: poll.survey?.question || '',
      deadline: poll.deadline || '',
      options: (poll.survey?.options || []).map((o, i) => ({ id: i, text: o.text })),
    })
    setEditingId(poll.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (poll) => {
    showConfirm(`¿Eliminar la votación "${poll.title}"?`, async () => {
      try { await deletePoll(poll.id); logAction?.('ELIMINAR_VOTACION', poll.title); showAlert('Votación eliminada.') }
      catch { showAlert('No se pudo eliminar.') }
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900">Votaciones</h2>
          <p className="text-zinc-500 mt-1">Decisiones de la comunidad por consenso.</p>
        </div>
        {canManage && !isGuestUser && (
          <button
            type="button"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true) }}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold flex items-center shadow-sm hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancelar' : <><PlusCircle className="w-5 h-5 mr-2" /> Crear Votación</>}
          </button>
        )}
      </div>

      {isGuestUser && <GuestBanner onRegisterRequest={onRegisterRequest} />}

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-blue-200 shadow-md animate-in slide-in-from-top-4">
          <h3 className="text-xl font-black mb-6 flex items-center text-blue-900">
            <CheckSquare className="w-6 h-6 mr-2 text-blue-500" /> {editingId ? 'Editar Votación' : 'Nueva Votación'}
          </h3>
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
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1.5">Título *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-zinc-200 p-3 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1.5">Contexto / razón *</label>
              <textarea required value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="w-full border border-zinc-200 p-3 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 h-20" />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1.5">Fecha de cierre *</label>
              <input required type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full border border-zinc-200 p-3 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
              <label className="block text-base font-bold text-blue-900 mb-2">Pregunta *</label>
              <input required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full border border-blue-200 p-3 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-bold text-blue-800">Opciones de respuesta</label>
                {aiEnabled && <button type="button" onClick={() => void handleAiSuggestOptions()} disabled={aiBusy} className="bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center hover:bg-blue-50 disabled:opacity-50">
                  <Sparkles className="w-3 h-3 mr-1.5 text-amber-500" /> {aiBusy ? 'Pensando…' : 'Sugerir con IA'}
                </button>}
              </div>
              <div className="space-y-3">
                {form.options.map((opt, idx) => (
                  <div key={opt.id} className="flex gap-2 items-center">
                    <input required value={opt.text} onChange={(e) => setForm((p) => ({ ...p, options: p.options.map((o) => o.id === opt.id ? { ...o, text: e.target.value } : o) }))} className="flex-1 border border-blue-200 p-3 rounded-xl outline-none focus:border-blue-400" placeholder={`Opción ${idx + 1}`} />
                    <button type="button" onClick={() => setForm((p) => ({ ...p, options: p.options.filter((o) => o.id !== opt.id) }))} className="text-red-500 p-2 bg-white border border-red-200 rounded-xl hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setForm((p) => ({ ...p, options: [...p.options, { id: Date.now(), text: '' }] }))} className="mt-3 text-blue-600 font-bold text-sm flex items-center">
                <PlusCircle className="w-4 h-4 mr-1" /> Añadir opción
              </button>
            </div>
            <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando…' : editingId ? 'Actualizar Votación' : 'Publicar Votación'}
            </button>
          </form>
        </div>
      )}

      {(db.polls || []).length === 0 && !showForm && (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
          <BarChart2 className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
          <p className="text-zinc-800 font-bold text-lg mb-1">No hay votaciones activas</p>
          <p className="text-zinc-500 text-sm">Las votaciones aparecerán aquí cuando se publiquen.</p>
        </div>
      )}

      <div className="space-y-6">
        {(db.polls || []).map((poll) => {
          const { isClosed, formatted } = safeDateParse(poll.deadline)
          const remaining = getTimeRemainingLabel(poll.deadline)
          const votes = poll.survey?.votes || []
          const userVote = votes.find((v) => v.username === currentUser.username)
          const isOwner = currentUser.username === poll.authorUsername
          const canEdit = (isOwner || canManage) && !isGuestUser
          const showResults = isClosed || userVote || isGuestUser

          return (
            <article key={poll.id} className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 md:p-8 relative group">
              {canEdit && (
                <div className="absolute top-6 right-6 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => startEdit(poll)} className="p-2 bg-white shadow-sm border border-zinc-200 text-blue-600 rounded-xl hover:bg-blue-50"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(poll)} className="p-2 bg-white shadow-sm border border-zinc-200 text-red-600 rounded-xl hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
              <div className="flex justify-between items-start mb-4 pr-20">
                <h3 className="text-2xl font-black text-zinc-900 leading-tight">{poll.title}</h3>
                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 ml-4 ${isClosed ? 'bg-zinc-700 text-white' : 'bg-green-600 text-white'}`}>
                  {isClosed ? 'Cerrada' : 'Activa'}
                </span>
              </div>
              <p className="text-zinc-600 mb-2 text-sm">{poll.excerpt}</p>
              {remaining && !isClosed && (
                <p className="text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-3 py-1.5 rounded-lg inline-block mb-4">{remaining}</p>
              )}
              {!remaining && !isClosed && (
                <p className="text-xs text-zinc-400 mb-4">Cierra: {formatted}</p>
              )}

              {showResults ? (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 overflow-hidden max-w-2xl shadow-sm">
                  <div className="bg-white px-5 py-4 border-b border-zinc-200">
                    <h4 className="font-black text-zinc-900 text-base leading-snug flex items-start gap-3">
                      <BarChart2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <span>{poll.survey?.question}</span>
                    </h4>
                    <p className="text-xs text-zinc-500 mt-2 font-medium pl-8">
                      {votes.length} voto{votes.length !== 1 ? 's' : ''} registrado{votes.length !== 1 ? 's' : ''}.
                    </p>
                  </div>
                  <div className="divide-y divide-zinc-200 bg-white">
                    {(poll.survey?.options || []).map((opt) => {
                      const optVotes = votes.filter((v) => v.optionId === opt.id)
                      const maxVotes = Math.max(...(poll.survey?.options || []).map((o) => votes.filter((v) => v.optionId === o.id).length), 0)
                      const isWinner = optVotes.length > 0 && optVotes.length === maxVotes
                      const isMyVote = userVote?.optionId === opt.id && !isGuestUser
                      const pct = votes.length > 0 ? Math.round((optVotes.length / votes.length) * 100) : 0
                      const listKey = voterListKey(poll.id, opt.id)
                      const votersOpen = Boolean(voterListOpen[listKey])
                      const sortedVoters = [...optVotes].sort((a, b) =>
                        resolveVoterDisplayName(a.username).localeCompare(resolveVoterDisplayName(b.username), 'es'),
                      )
                      return (
                        <div key={opt.id} className="px-4 py-4 md:px-5 hover:bg-zinc-50/90 transition-colors">
                          <div className="flex justify-between items-center mb-2 gap-3">
                            <span className={`font-bold text-sm flex items-center gap-2 min-w-0 ${isMyVote ? 'text-green-800' : 'text-zinc-800'}`}>
                              {isMyVote && (
                                <span className="bg-green-100 border border-green-200 rounded-md w-6 h-6 flex items-center justify-center shrink-0">
                                  <Check className="w-3.5 h-3.5 text-green-700" />
                                </span>
                              )}
                              <span className="truncate">{opt.text}</span>
                            </span>
                            <span className="text-zinc-600 text-sm font-black flex items-center gap-1 shrink-0 tabular-nums">
                              {optVotes.length}
                              {isWinner && votes.length > 0 && <span className="text-amber-500" aria-hidden>★</span>}
                            </span>
                          </div>
                          <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all ${isMyVote ? 'bg-green-600' : isWinner && votes.length > 0 ? 'bg-blue-600' : 'bg-zinc-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1.5 font-medium tabular-nums">{pct}%</p>

                          {optVotes.length > 0 && (
                            <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/80 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setVoterListOpen((prev) => ({ ...prev, [listKey]: !prev[listKey] }))}
                                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-bold text-blue-800 hover:bg-white/90 transition-colors"
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <ChevronDown className={`w-4 h-4 text-blue-600 shrink-0 transition-transform ${votersOpen ? 'rotate-180' : ''}`} />
                                  {votersOpen ? 'Ocultar votantes' : `Quiénes votaron aquí (${optVotes.length})`}
                                </span>
                              </button>
                              {votersOpen && (
                                <ul className="px-3 pb-3 pt-0 space-y-1.5 border-t border-zinc-200/80 bg-white">
                                  {sortedVoters.map((v) => (
                                    <li
                                      key={`${v.username}-${v.timestamp || ''}`}
                                      className="flex items-start gap-2 text-xs text-zinc-700 py-1.5 pl-1 border-b border-zinc-100 last:border-0"
                                    >
                                      <User className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                                      <span className="min-w-0 flex-1">
                                        <span className="font-bold text-zinc-900">{resolveVoterDisplayName(v.username)}</span>
                                        <span className="text-zinc-400 font-medium"> @{v.username}</span>
                                        {v.timestamp ? (
                                          <span className="block text-[10px] text-zinc-400 mt-0.5 font-medium">{v.timestamp}</span>
                                        ) : null}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-w-2xl">
                  <h4 className="font-bold text-zinc-800 text-base">{poll.survey?.question}</h4>
                  {(poll.survey?.options || []).map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedOptions[poll.id] === opt.id ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 hover:border-blue-300 bg-white'}`}
                    >
                      <input
                        type="radio"
                        name={`poll-${poll.id}`}
                        className="h-4 w-4 accent-blue-600"
                        checked={selectedOptions[poll.id] === opt.id}
                        onChange={() => setSelectedOptions((s) => ({ ...s, [poll.id]: opt.id }))}
                      />
                      <span className="font-medium text-zinc-800">{opt.text}</span>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => void handleVote(poll.id)}
                    disabled={!selectedOptions[poll.id]}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-40 mt-2"
                  >
                    Registrar mi voto
                  </button>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default PollsView
