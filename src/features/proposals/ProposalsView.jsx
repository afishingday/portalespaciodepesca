import { useState } from 'react'
import {
  PlusCircle, Sparkles, Edit3, Trash2, CalendarDays, CheckSquare, Lock, User,
} from 'lucide-react'
import { isAdminLike, isGuest } from '../../shared/utils.js'
import {
  polishProposalDraft,
  fetchGeminiDescriptionFromTitle,
  fetchGeminiDuplicateCheck,
  fetchGeminiProposalPollDraft,
  isGeminiConfigured,
  isProposalConvertPollGeminiConfigured,
  getLastGeminiDetail,
} from '../../geminiClient.js'

function emptyProposalPollConvForm(proposalTitle = 'esta propuesta') {
  const t = Date.now()
  return {
    question: `¿Apruebas: "${proposalTitle}"?`,
    deadline: '',
    optionRows: [
      { id: t, text: '' },
      { id: t + 1, text: '' },
    ],
  }
}

const GuestBanner = ({ onRegisterRequest }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-5 mb-6 shadow-sm">
    <div className="flex items-center gap-4">
      <div className="bg-blue-100 p-3 rounded-full shrink-0"><Lock className="w-6 h-6 text-blue-600" /></div>
      <div>
        <h4 className="font-black text-blue-900">Exclusiva para cuentas registradas</h4>
        <p className="text-sm text-blue-700 font-medium">Solicita acceso para publicar propuestas y participar activamente.</p>
      </div>
    </div>
    <button onClick={onRegisterRequest} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black text-sm transition-colors shadow-md w-full md:w-auto">
      Solicitar Acceso
    </button>
  </div>
)

const ProposalsView = ({ currentUser, db, saveProposal, deleteProposal, convertProposalToPoll, convertProposalToEvent, logAction, showAlert, showConfirm, onRegisterRequest }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState({ title: '', excerpt: '' })
  const [saving, setSaving] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)

  const [convModal, setConvModal] = useState(null)
  const [convForm, setConvForm] = useState({})
  const [convPollAiBusy, setConvPollAiBusy] = useState(false)
  const [convSubmitting, setConvSubmitting] = useState(false)

  const isGuestUser = isGuest(currentUser)
  const canManage = isAdminLike(currentUser)
  const aiEnabled = isGeminiConfigured()

  const resetForm = () => { setShowForm(false); setEditingId(null); setDraft({ title: '', excerpt: '' }) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const titleTrimmed = draft.title.trim()
    const excerptTrimmed = draft.excerpt.trim()
    if (!titleTrimmed) return showAlert('Escribe el título de la propuesta.')
    if (!excerptTrimmed) return showAlert('Agrega una breve descripción.')

    const doSave = async () => {
      setSaving(true)
      try {
        const isEditing = editingId != null
        const prev = isEditing ? (db.proposals || []).find((p) => p.id === editingId) : null
        const proposal = {
          ...(prev || {}),
          id: editingId || Date.now(),
          title: titleTrimmed,
          excerpt: excerptTrimmed,
          author: prev?.author ?? currentUser.name,
          authorUsername: prev?.authorUsername ?? currentUser.username,
          date: prev?.date ?? new Date().toLocaleDateString('es-CO'),
          status: 'Propuesta',
        }
        await saveProposal(proposal)
        logAction?.(isEditing ? 'EDITAR_PROPUESTA' : 'NUEVA_PROPUESTA', proposal.title)
        resetForm()
        showAlert(isEditing ? 'Propuesta actualizada.' : 'Propuesta enviada. El administrador puede convertirla en votación o evento.')
      } catch (err) {
        console.error(err)
        showAlert('No se pudo guardar la propuesta.')
      } finally {
        setSaving(false)
      }
    }

    if (editingId) { showConfirm(`¿Guardar los cambios en "${titleTrimmed}"?`, () => void doSave()); return }

    if (isGeminiConfigured() && (db.proposals || []).length > 0) {
      setAiBusy(true)
      try {
        const result = await fetchGeminiDuplicateCheck(titleTrimmed, excerptTrimmed, (db.proposals || []).map((p) => ({ title: p.title || '', excerpt: p.excerpt || '' })))
        if (result?.hasSimilar && result.similarTitles.length > 0) {
          const list = result.similarTitles.map((t) => `• ${t}`).join('\n')
          showConfirm(`Ya existe una propuesta similar:\n${list}\n\n¿Deseas enviarla de todas formas?`, () => void doSave())
          return
        }
      } catch { /* silently ignore */ } finally { setAiBusy(false) }
    }
    showConfirm(`¿Enviar la propuesta "${titleTrimmed}"?`, () => void doSave())
  }

  const handleAiPolish = async () => {
    if (!draft.title.trim() && !draft.excerpt.trim()) return showAlert('Escribe título o descripción para usar la IA.')
    if (!isGeminiConfigured()) return showAlert('Configura VITE_GEMINI_API_KEY en .env para usar la IA.')
    setAiBusy(true)
    try {
      const prevTitle = draft.title.trim()
      const prevExcerpt = draft.excerpt.trim()
      const res = await polishProposalDraft({ title: draft.title, excerpt: draft.excerpt })
      if (!res) { showAlert(getLastGeminiDetail() || 'La IA no respondió. Inténtalo de nuevo.'); return }
      const nextTitle = prevTitle ? (res.title || draft.title).trim() : draft.title
      const nextExcerpt = prevExcerpt ? (res.excerpt || draft.excerpt).trim() : draft.excerpt
      const changed = nextTitle !== prevTitle || nextExcerpt !== prevExcerpt
      setDraft((p) => ({
        title: prevTitle ? (res.title || p.title) : p.title,
        excerpt: prevExcerpt ? (res.excerpt || p.excerpt) : p.excerpt,
      }))
      showAlert(changed ? 'Sugerencias aplicadas. Revísalas antes de enviar.' : 'La IA respondió, pero no encontró cambios relevantes para mejorar.')
    } catch { showAlert('Error al contactar la IA.') } finally { setAiBusy(false) }
  }

  const handleDescriptionFromTitle = async () => {
    if (!draft.title.trim()) return showAlert('Escribe el título primero.')
    if (!isGeminiConfigured()) return showAlert('Configura VITE_GEMINI_API_KEY en .env para usar la IA.')
    setAiBusy(true)
    try {
      const res = await fetchGeminiDescriptionFromTitle(draft.title)
      if (res?.description) {
        const prevExcerpt = draft.excerpt.trim()
        const nextExcerpt = String(res.description).trim()
        setDraft((p) => ({ ...p, excerpt: res.description }))
        showAlert(nextExcerpt !== prevExcerpt
          ? 'Descripción sugerida desde el título. Revísala antes de enviar.'
          : 'La IA respondió, pero la descripción quedó igual a la actual.')
      }
      else showAlert(getLastGeminiDetail() || 'No se pudo generar la descripción.')
    } catch { showAlert('Error al contactar la IA.') } finally { setAiBusy(false) }
  }

  const handleDelete = (proposal) => {
    showConfirm(`¿Eliminar la propuesta "${proposal.title}"?`, async () => {
      try {
        await deleteProposal(proposal.id)
        logAction?.('ELIMINAR_PROPUESTA', proposal.title)
        showAlert('Propuesta eliminada.')
      } catch { showAlert('No se pudo eliminar.') }
    })
  }

  const handleConvPollAiSuggest = async () => {
    const proposal = convModal?.proposal
    if (!proposal) return
    if (!isProposalConvertPollGeminiConfigured()) {
      return showAlert(
        'Para sugerencias con IA aquí: configura VITE_GEMINI_API_KEY y activa VITE_AI_PROPOSAL_CONVERT_POLL=true o VITE_AI_ENABLED=true en .env; luego reinicia el servidor.',
      )
    }
    setConvPollAiBusy(true)
    try {
      const res = await fetchGeminiProposalPollDraft(proposal)
      if (!res) {
        showAlert(getLastGeminiDetail() || 'La IA no pudo generar el borrador. Completa los campos manualmente.')
        return
      }
      const rows = res.suggestedOptions.map((text, i) => ({
        id: Date.now() + i,
        text: String(text || '').trim(),
      })).filter((r) => r.text)
      while (rows.length < 2) {
        rows.push({ id: Date.now() + rows.length + 100, text: '' })
      }
      setConvForm((f) => ({
        ...f,
        question: res.question,
        optionRows: rows,
      }))
      showAlert('Borrador sugerido. Revísalo y edítalo antes de confirmar.')
    } catch {
      showAlert('Error al contactar la IA.')
    } finally {
      setConvPollAiBusy(false)
    }
  }

  const handleConvert = async (e) => {
    e.preventDefault()
    if (convSubmitting) return
    const { type, proposal } = convModal
    if (type === 'poll') {
      const rows = Array.isArray(convForm.optionRows) ? convForm.optionRows : []
      const optionsArray = rows
        .map((o) => String(o.text || '').trim())
        .filter(Boolean)
        .map((text, i) => ({ id: `opt${i}`, text }))
      if (optionsArray.length < 2) return showAlert('Completa al menos 2 opciones de respuesta.')
      if (!convForm.deadline) return showAlert('Selecciona una fecha de cierre.')
      const newPoll = {
        id: Date.now(), title: proposal.title, excerpt: proposal.excerpt,
        author: proposal.author, authorUsername: proposal.authorUsername,
        date: new Date().toLocaleDateString('es-CO'), deadline: convForm.deadline,
        survey: {
          question: (convForm.question && String(convForm.question).trim()) || `¿Apruebas: "${proposal.title}"?`,
          options: optionsArray,
          votes: [],
        },
      }
      setConvSubmitting(true)
      try {
        await convertProposalToPoll(proposal.id, newPoll)
        logAction?.('CONVERTIR_A_VOTACION', proposal.title)
        setConvModal(null)
        setConvForm({})
        setConvPollAiBusy(false)
        showAlert('Propuesta convertida en votación.')
      } catch { showAlert('No se pudo convertir la propuesta.') }
      finally { setConvSubmitting(false) }
    } else {
      if (!convForm.date) return showAlert('Selecciona una fecha para el evento.')
      if (!convForm.location) return showAlert('Escribe el lugar del evento.')
      const newEvent = {
        id: Date.now(), title: proposal.title, description: proposal.excerpt,
        date: convForm.date, location: convForm.location,
      }
      setConvSubmitting(true)
      try {
        await convertProposalToEvent(proposal.id, newEvent)
        logAction?.('CONVERTIR_A_EVENTO', proposal.title)
        setConvModal(null)
        setConvForm({})
        setConvPollAiBusy(false)
        showAlert('Propuesta convertida en evento.')
      } catch { showAlert('No se pudo convertir la propuesta.') }
      finally { setConvSubmitting(false) }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {convModal && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border-t-4 border-blue-600 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-zinc-900 mb-6">
              Convertir a {convModal.type === 'poll' ? 'Votación' : 'Evento Oficial'}
            </h3>
            <form onSubmit={handleConvert} className="space-y-4">
              {convModal.type === 'poll' ? (
                <>
                  {isProposalConvertPollGeminiConfigured() ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleConvPollAiSuggest()}
                        disabled={convPollAiBusy}
                        className="inline-flex items-center rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                      >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                        {convPollAiBusy ? 'Generando…' : 'Sugerir pregunta y opciones (IA)'}
                      </button>
                      <p className="text-xs text-zinc-600">
                        La IA rellena la pregunta y cada opción en su propio campo. Puedes editarlas o añadir más antes de confirmar.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                      Sugerencias automáticas: configura <span className="font-mono">VITE_GEMINI_API_KEY</span> y{' '}
                      <span className="font-mono">VITE_AI_PROPOSAL_CONVERT_POLL=true</span> (o activa toda la IA con{' '}
                      <span className="font-mono">VITE_AI_ENABLED=true</span>).
                    </p>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Pregunta de la votación</label>
                    <input
                      value={convForm.question ?? ''}
                      onChange={(e) => setConvForm((f) => ({ ...f, question: e.target.value }))}
                      placeholder="Ej: ¿Apruebas esta propuesta?"
                      className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                    <label className="block text-sm font-bold text-blue-900 mb-2">Opciones de respuesta *</label>
                    <p className="text-xs text-zinc-600 mb-3">Mínimo 2 opciones. Puedes añadir o quitar filas.</p>
                    <div className="space-y-2">
                      {(convForm.optionRows || []).map((row, idx) => (
                        <div key={row.id} className="flex gap-2 items-center">
                          <input
                            value={row.text}
                            onChange={(e) =>
                              setConvForm((f) => ({
                                ...f,
                                optionRows: (f.optionRows || []).map((r) =>
                                  r.id === row.id ? { ...r, text: e.target.value } : r,
                                ),
                              }))}
                            className="flex-1 p-3 border border-blue-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder={`Opción ${idx + 1}`}
                          />
                          <button
                            type="button"
                            disabled={(convForm.optionRows || []).length <= 2}
                            onClick={() =>
                              setConvForm((f) => ({
                                ...f,
                                optionRows: (f.optionRows || []).filter((r) => r.id !== row.id),
                              }))}
                            className="shrink-0 p-2.5 rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:pointer-events-none"
                            aria-label={`Quitar opción ${idx + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConvForm((f) => ({
                          ...f,
                          optionRows: [...(f.optionRows || []), { id: Date.now(), text: '' }],
                        }))}
                      className="mt-3 text-sm font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                    >
                      <PlusCircle className="w-4 h-4" /> Añadir opción
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Fecha de cierre *</label>
                    <input
                      required
                      type="datetime-local"
                      value={convForm.deadline ?? ''}
                      onChange={(e) => setConvForm((f) => ({ ...f, deadline: e.target.value }))}
                      className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Fecha del evento *</label>
                    <input
                      required
                      type="datetime-local"
                      value={convForm.date ?? ''}
                      onChange={(e) => setConvForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Lugar *</label>
                    <input
                      required
                      value={convForm.location ?? ''}
                      onChange={(e) => setConvForm((f) => ({ ...f, location: e.target.value }))}
                      placeholder="Ej: Embalse Peñol-Guatapé"
                      className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setConvModal(null)
                    setConvForm({})
                    setConvPollAiBusy(false)
                    setConvSubmitting(false)
                  }}
                  disabled={convSubmitting}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-3 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={convSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-60 disabled:pointer-events-none"
                >
                  {convSubmitting ? 'Confirmando…' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900">Muro de Propuestas</h2>
          <p className="text-zinc-500 mt-1">Ideas de salidas, torneos, charlas y mejoras para la comunidad.</p>
        </div>
        {!isGuestUser && (
          <button
            type="button"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true) }}
            className="bg-green-500 text-zinc-950 px-5 py-3 rounded-xl font-black flex items-center shadow-sm hover:bg-green-400 transition-colors"
          >
            {showForm ? 'Cancelar' : <><PlusCircle className="w-5 h-5 mr-2" /> Tirar una idea</>}
          </button>
        )}
      </div>

      {isGuestUser && <GuestBanner onRegisterRequest={onRegisterRequest} />}

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-green-200 shadow-md animate-in slide-in-from-top-4">
          <h3 className="text-xl font-black mb-4">{editingId ? 'Editar Propuesta' : 'Nueva Propuesta'}</h3>
          {aiEnabled && <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 mb-4">
            <button type="button" onClick={() => void handleAiPolish()} disabled={aiBusy} className="inline-flex items-center rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-800 hover:bg-amber-100 disabled:opacity-60">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> {aiBusy ? 'Procesando…' : 'Mejorar lo que escribí (IA)'}
            </button>
            <button type="button" onClick={() => void handleDescriptionFromTitle()} disabled={aiBusy} className="inline-flex items-center rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-50 disabled:opacity-60">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> Descripción desde el título
            </button>
            <p className="text-xs text-zinc-600">Mejorar pulirá título y texto si ya los tienes. Descripción desde el título rellena o sustituye el texto según el título; revísala siempre antes de enviar.</p>
          </div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Título *</label>
              <input required value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Ej: Salida al Río Tomo en junio" className="w-full p-4 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Descripción *</label>
              <textarea required value={draft.excerpt} onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))} placeholder="Cuéntanos qué se quiere hacer y por qué..." className="w-full p-4 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-green-500 h-24" />
            </div>
            <button type="submit" disabled={saving || aiBusy} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 w-full md:w-auto">
              {saving ? 'Guardando…' : aiBusy ? 'Verificando…' : editingId ? 'Guardar cambios' : 'Publicar Propuesta'}
            </button>
          </form>
        </div>
      )}

      {(db.proposals || []).length === 0 && !showForm && (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
          <p className="text-zinc-800 font-bold text-lg mb-1">No hay propuestas activas</p>
          <p className="text-zinc-500 text-sm">Usa el botón «Tirar una idea» para ser el primero en proponer algo.</p>
        </div>
      )}

      <div className="space-y-4">
        {(db.proposals || []).map((prop) => {
          const isOwner = currentUser.username === prop.authorUsername
          const canEdit = (isOwner || canManage) && !isGuestUser
          return (
            <div key={prop.id} className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-200 shadow-sm hover:border-blue-200 transition-colors relative group">
              {canEdit && (
                <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setDraft({ title: prop.title, excerpt: prop.excerpt }); setEditingId(prop.id); setShowForm(true) }} className="p-2 bg-zinc-50 hover:bg-blue-50 text-blue-600 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(prop)} className="p-2 bg-zinc-50 hover:bg-red-50 text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-md">{prop.status}</span>
                <span className="text-xs text-zinc-500 font-bold flex items-center gap-1"><User className="w-3 h-3 text-blue-500" />{prop.author} {isOwner && !isGuestUser && '(Tú)'}</span>
              </div>
              <h4 className="text-xl font-black text-zinc-900 mb-2 pr-16">{prop.title}</h4>
              <p className="text-zinc-600 text-sm font-medium">{prop.excerpt}</p>
              {canManage && (
                <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-zinc-100">
                  <button
                    onClick={() => {
                      setConvModal({ type: 'poll', proposal: prop })
                      setConvForm(emptyProposalPollConvForm(prop.title))
                      setConvPollAiBusy(false)
                    }}
                    className="inline-flex items-center bg-zinc-50 text-zinc-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 transition-colors"
                  >
                    <CheckSquare className="w-4 h-4 mr-1.5" /> Convertir a Votación
                  </button>
                  <button onClick={() => { setConvModal({ type: 'event', proposal: prop }); setConvForm({ date: '', location: '' }) }} className="inline-flex items-center bg-zinc-50 text-zinc-700 hover:text-green-600 hover:bg-green-50 px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 transition-colors">
                    <CalendarDays className="w-4 h-4 mr-1.5" /> Convertir a Evento
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProposalsView
