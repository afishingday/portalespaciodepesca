import { useMemo, useState } from 'react'
import {
  Plus,
  Send,
  Trash2,
  Loader2,
  User,
  Calendar,
  AlertCircle,
  Fish,
  Handshake,
  Phone,
  Globe,
  Pencil,
  X,
  Briefcase,
} from 'lucide-react'
import { isGuest } from '../../shared/utils.js'
import { TENANT } from '../../tenant.config.js'
import { BRAND_LOGO_SRC } from '../../brandAssets.js'
import { todayIsoDate, displayPortalDate, parseToIsoDate } from '../../shared/portalDates.js'
import { serviceTypeLabel } from '../../shared/fishingServiceTypes.js'

const cardShell = 'w-full max-w-xl mx-auto bg-white/95 rounded-[2rem] shadow-xl shadow-blue-100/40 border border-blue-100/50 overflow-hidden'

const emptyForm = () => ({
  memberName: '',
  serviceType: '',
  phone: '',
  socialNetworks: '',
})

/** Registro nuevo (v2) o antiguo con title/body/serviceTypes. */
function postToForm(p) {
  if (p.memberName != null && String(p.memberName).trim() !== '') {
    return {
      memberName: String(p.memberName).trim(),
      serviceType: String(p.serviceType ?? '').trim(),
      phone: p.phone || '',
      socialNetworks: p.socialNetworks || p.webSocial || '',
    }
  }
  const legacyType =
    typeof p.serviceType === 'string' && p.serviceType.trim()
      ? p.serviceType.trim()
      : Array.isArray(p.serviceTypes) && p.serviceTypes.length
        ? p.serviceTypes.map(serviceTypeLabel).join(', ')
        : (p.title || '').trim()
  return {
    memberName: (p.author || '').trim(),
    serviceType: legacyType || (p.body || '').slice(0, 200).trim(),
    phone: p.phone || '',
    socialNetworks: p.socialNetworks || p.webSocial || '',
  }
}

function isNewFormatPost(p) {
  return p.memberName != null && String(p.memberName).trim() !== ''
}

export default function CommunityView({ currentUser, db, saveCommunityPost, deleteCommunityPost, logAction, showAlert, showConfirm }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const isGuestUser = isGuest(currentUser)
  const posts = useMemo(() => [...(db.communityPosts || [])].sort((a, b) => Number(b.id) - Number(a.id)), [db.communityPosts])

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(false)
  }

  const openNew = () => {
    setEditingId(null)
    setForm({ ...emptyForm(), memberName: currentUser.name })
    setShowForm(true)
  }

  const startEdit = (p) => {
    setEditingId(p.id)
    setForm(postToForm(p))
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const memberName = form.memberName.trim()
    const serviceType = form.serviceType.trim()
    const phone = form.phone.trim()
    const socialNetworks = form.socialNetworks.trim()
    if (memberName.length < 2) return showAlert('Indica el nombre público (mínimo 2 caracteres).')
    if (memberName.length > 120) return showAlert('El nombre es demasiado largo (máx. 120).')
    if (serviceType.length < 3) return showAlert('Describe el tipo de servicio (mínimo 3 caracteres).')
    if (serviceType.length > 300) return showAlert('El tipo de servicio admite máximo 300 caracteres.')
    if (!phone || phone.replace(/\D/g, '').length < 7) return showAlert('Ingresa un teléfono o WhatsApp válido.')
    if (socialNetworks.length > 500) return showAlert('Redes sociales: máximo 500 caracteres.')
    setSaving(true)
    try {
      const isEdit = editingId != null
      const prev = isEdit ? posts.find((r) => String(r.id) === String(editingId)) : null
      const id = isEdit ? editingId : Date.now()
      const date = isEdit && prev?.date ? prev.date : todayIsoDate()
      await saveCommunityPost({
        id,
        memberName,
        serviceType,
        phone,
        socialNetworks,
        author: memberName,
        authorUsername: prev?.authorUsername ?? currentUser.username,
        date,
      })
      logAction?.(isEdit ? 'EDITAR_SERVICIO_SOCIO' : 'NUEVO_SERVICIO_SOCIO', `${memberName} · ${serviceType}`.slice(0, 80))
      resetForm()
      showAlert(isEdit ? 'Registro actualizado.' : 'Tu servicio ya está visible para quienes tienen cuenta en el portal.')
    } catch {
      showAlert('No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  const displayTitle = (p) => (isNewFormatPost(p) ? p.memberName : p.author || p.title || 'Miembro')

  const handleDelete = (p) => {
    showConfirm(`¿Eliminar el registro de «${displayTitle(p)}»?`, async () => {
      try {
        await deleteCommunityPost(p.id)
        logAction?.('ELIMINAR_SERVICIO_SOCIO', String(p.id))
        if (editingId != null && String(editingId) === String(p.id)) resetForm()
        showAlert('Registro eliminado.')
      } catch {
        showAlert('No se pudo eliminar.')
      }
    })
  }

  const canEditPost = (p) => p.authorUsername === currentUser.username

  const canDeletePost = (p) => p.authorUsername === currentUser.username

  return (
    <div className="space-y-8 animate-in fade-in max-w-3xl mx-auto">
      <div>
        <h2 className="text-3xl font-black text-zinc-900 flex items-center gap-2 flex-wrap">
          <Handshake className="w-8 h-8 text-blue-700 shrink-0" />
          Servicios de nuestra comunidad
        </h2>
        <p className="text-zinc-500 mt-2 leading-relaxed">
          En nuestra comunidad hay distintos servicios y profesiones: nos destaca apoyarnos entre nosotros. Este espacio es para que{' '}
          <span className="font-bold text-zinc-700">quien tenga cuenta aprobada registre lo que ofrece</span> y quede a la mano del resto de personas
          registradas para contactarlo cuando lo necesiten.
        </p>
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-950 font-medium leading-relaxed">
          <strong className="font-black">Exclusiva para cuentas registradas:</strong> el invitado no ve esta sección. Cada persona solo puede editar o eliminar los
          registros que ella misma publicó. El grupo no valida negocios ni actúa como intermediario.
        </div>
      </div>

      {!isGuestUser && (
        <>
          <div className="flex flex-wrap gap-2">
            {!showForm ? (
              <button
                type="button"
                onClick={openNew}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                Registrar mi servicio
              </button>
            ) : (
              <button
                type="button"
                onClick={() => (editingId != null ? resetForm() : setShowForm(false))}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 font-bold text-sm text-zinc-700 hover:bg-zinc-50"
              >
                <X className="w-4 h-4" />
                {editingId != null ? 'Cancelar edición' : 'Ocultar formulario'}
              </button>
            )}
          </div>

          {showForm && (
            <div className={cardShell}>
              <div className="bg-black px-6 py-5 text-center text-white">
                {BRAND_LOGO_SRC ? (
                  <img src={BRAND_LOGO_SRC} alt="" className="h-14 w-auto max-w-[200px] object-contain mx-auto mb-2" />
                ) : (
                  <Fish className="w-10 h-10 text-cyan-400 mx-auto mb-2" strokeWidth={1.5} />
                )}
                <p className="text-xs font-black tracking-[0.15em] uppercase text-blue-300">{TENANT.name}</p>
                <p className="text-sm font-bold mt-1 flex items-center justify-center gap-2">
                  <Handshake className="w-4 h-4 shrink-0" />
                  {editingId != null ? 'Editar registro' : 'Registrar servicio'}
                </p>
              </div>
              <form onSubmit={(e) => void handleSubmit(e)} className="p-6 md:p-8 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Nombre público</label>
                  <input
                    value={form.memberName}
                    onChange={(e) => setForm((f) => ({ ...f, memberName: e.target.value }))}
                    placeholder="Cómo te verán quienes consulten el listado"
                    className="w-full p-4 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                    maxLength={120}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Tipo de servicio</label>
                  <input
                    value={form.serviceType}
                    onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))}
                    placeholder="Ej: contaduría, mecánica, fotografía, taller de cañas…"
                    className="w-full p-4 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                    maxLength={300}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Teléfono</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="Celular o WhatsApp"
                    className="w-full p-4 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Redes sociales</label>
                  <input
                    value={form.socialNetworks}
                    onChange={(e) => setForm((f) => ({ ...f, socialNetworks: e.target.value }))}
                    placeholder="@usuario, Instagram, Facebook, web…"
                    className="w-full p-4 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                    maxLength={500}
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 text-white p-4 rounded-xl font-black hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {saving ? 'Guardando…' : editingId != null ? 'Guardar cambios' : 'Publicar'}
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {isGuestUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-900 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>Esta sección es exclusiva para cuentas registradas en el portal. Inicia sesión para verla y usarla.</p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-black text-zinc-800">Servicios registrados</h3>
        {posts.length === 0 ? (
          <p className="text-zinc-500 text-sm font-medium">Aún no hay registros.</p>
        ) : (
          posts.map((p) => {
            const v2 = isNewFormatPost(p)
            const name = v2 ? p.memberName : displayTitle(p)
            const svc = v2
              ? p.serviceType
              : (p.title && p.body ? `${p.title} — ${(p.body || '').slice(0, 160)}${(p.body || '').length > 160 ? '…' : ''}` : p.title || p.body || '—')
            return (
              <article
                key={p.id}
                className={`${cardShell} p-5 md:p-6 border-l-[6px] border-l-emerald-600 shadow-emerald-950/5`}
              >
                <div className="flex justify-between gap-3 items-start">
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center rounded-full bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wide px-2.5 py-1 mb-2">
                      {TENANT.memberServiceCardBadge}
                    </span>
                    <p className="text-xs font-black uppercase tracking-wide text-zinc-500 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Miembro
                    </p>
                    <h4 className="text-lg font-black text-zinc-900 leading-tight mt-0.5">{name}</h4>
                    <p className="text-xs font-black uppercase tracking-wide text-zinc-500 mt-3 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" /> Tipo de servicio
                    </p>
                    <p className="text-sm font-bold text-zinc-800 mt-0.5 leading-snug">{svc}</p>
                  </div>
                  {!isGuestUser && (
                    <div className="flex gap-1 shrink-0">
                      {canEditPost(p) && (
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="p-2 rounded-lg text-blue-700 hover:bg-blue-50 border border-blue-100"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {canDeletePost(p) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-100"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {!v2 && (
                  <p className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 mt-2 inline-block">
                    Formato anterior: al editar y guardar se unifica al nuevo formato (solo nombre, servicio, teléfono y redes).
                  </p>
                )}
                <div className="mt-4 flex flex-col gap-2 text-sm border-t border-zinc-100 pt-4">
                  {p.phone ? (
                    <a href={`tel:${String(p.phone).replace(/\s/g, '')}`} className="inline-flex items-center gap-2 font-bold text-blue-700 hover:underline">
                      <Phone className="w-4 h-4 shrink-0" />
                      {p.phone}
                    </a>
                  ) : (
                    <span className="text-zinc-400 text-xs font-medium">Sin teléfono</span>
                  )}
                  {(p.socialNetworks || p.webSocial) ? (
                    <span className="inline-flex items-start gap-2 font-medium text-zinc-700 break-all">
                      <Globe className="w-4 h-4 shrink-0 mt-0.5" />
                      {p.socialNetworks || p.webSocial}
                    </span>
                  ) : (
                    <span className="text-zinc-400 text-xs font-medium">Sin redes indicadas</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs font-bold text-zinc-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Cuenta: {p.authorUsername}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {displayPortalDate(parseToIsoDate(p.date))}
                  </span>
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
