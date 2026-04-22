import { useState } from 'react'
import { Users, UserCheck, UserX, Shield, ShieldOff, KeyRound, Clock, Loader2, Eye, EyeOff } from 'lucide-react'
import { DEFAULT_APPROVED_MEMBER_PASSWORD } from '../../shared/portalAuthConstants.js'

const AdminUsersView = ({ currentUser, db, approvePendingUser, rejectPendingUser, setUserBlockedStatus, updateUserProfile, logAction, showAlert, showConfirm }) => {
  const [tab, setTab] = useState('pending')
  const [resetTarget, setResetTarget] = useState(null)
  const [newPwd, setNewPwd] = useState('')
  const [showResetPwd, setShowResetPwd] = useState(false)
  const [saving, setSaving] = useState(false)
  const isSuperadmin = currentUser.role === 'superadmin'

  const pending = db.pendingUsers || []
  const members = (db.users || []).filter((u) => u.role !== 'superadmin')

  const handleApprove = (p) => {
    showConfirm(`¿Aprobar la cuenta de ${p.name} (${p.username}) en el portal?`, async () => {
      try {
        const newUser = {
          username: p.username,
          name: p.name,
          password: DEFAULT_APPROVED_MEMBER_PASSWORD,
          role: 'member',
          blocked: false,
          avatar: '',
          phone: String(p.phone ?? '').trim(),
        }
        await approvePendingUser(p.id, newUser)
        logAction?.('APROBAR_SOCIO', p.username)
        showAlert(
          `${p.name} tiene cuenta activa en el portal. Contraseña inicial: ${DEFAULT_APPROVED_MEMBER_PASSWORD}. Indícale que deberá cambiarla al entrar.`,
        )
      } catch { showAlert('No se pudo aprobar la solicitud.') }
    })
  }

  const handleReject = (p) => {
    showConfirm(`¿Rechazar la solicitud de ${p.name}?`, async () => {
      try { await rejectPendingUser(p.id); logAction?.('RECHAZAR_SOCIO', p.username); showAlert('Solicitud rechazada.') }
      catch { showAlert('No se pudo rechazar.') }
    })
  }

  const handleBlock = (u) => {
    const verb = u.blocked ? 'desbloquear' : 'bloquear'
    showConfirm(`¿${verb.charAt(0).toUpperCase() + verb.slice(1)} a ${u.name}?`, async () => {
      try {
        await setUserBlockedStatus(u.username, !u.blocked)
        logAction?.(u.blocked ? 'SUPERADMIN_DESBLOQUEO_USUARIO' : 'SUPERADMIN_BLOQUEO_USUARIO', u.username)
        showAlert(`Usuario ${u.blocked ? 'desbloqueado' : 'bloqueado'}.`)
      } catch { showAlert('No se pudo cambiar el estado.') }
    })
  }

  const handleResetPwd = async () => {
    if (!newPwd.trim() || newPwd.trim().length < 6) return showAlert('La contraseña debe tener al menos 6 caracteres.')
    setSaving(true)
    try {
      await updateUserProfile(resetTarget.username, { password: newPwd.trim() })
      logAction?.('SUPERADMIN_RESET_CLAVE', resetTarget.username)
      showAlert(`Contraseña de ${resetTarget.name} restablecida.`)
      setResetTarget(null)
      setNewPwd('')
      setShowResetPwd(false)
    } catch { showAlert('No se pudo restablecer la contraseña.') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-black text-zinc-900">Gestión de cuentas</h2>
        <p className="text-zinc-500 mt-1">Aprobación, bloqueo y administración de usuarios.</p>
      </div>

      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/30 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl p-6 max-w-sm w-full animate-in zoom-in-95">
            <h3 className="text-lg font-black text-zinc-900 mb-1 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" /> Restablecer contraseña
            </h3>
            <p className="text-sm text-zinc-500 mb-4">Para <span className="font-bold text-zinc-800">{resetTarget.name}</span> (@{resetTarget.username})</p>
            <div className="relative mb-4">
              <input
                type={showResetPwd ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Nueva contraseña..."
                className="w-full p-3 pr-11 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowResetPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-700 p-0.5"
                aria-label={showResetPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showResetPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setResetTarget(null); setNewPwd(''); setShowResetPwd(false) }} className="flex-1 py-3 rounded-xl border border-zinc-200 font-bold text-zinc-700 hover:bg-zinc-50 text-sm">
                Cancelar
              </button>
              <button type="button" onClick={handleResetPwd} disabled={saving} className="flex-1 py-3 rounded-xl bg-amber-500 text-zinc-950 font-black hover:bg-amber-400 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b border-zinc-100 pb-1">
        <button
          type="button"
          onClick={() => setTab('pending')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'pending' ? 'bg-blue-600 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
        >
          Solicitudes
          {pending.length > 0 && (
            <span className="ml-1.5 bg-red-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-1">
              {pending.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('members')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'members' ? 'bg-blue-600 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
        >
          Cuentas activas ({members.length})
        </button>
      </div>

      {tab === 'pending' && (
        pending.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
            <Clock className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-800 font-bold text-lg mb-1">Sin solicitudes pendientes</p>
            <p className="text-zinc-500 text-sm">Las solicitudes de registro aparecerán aquí.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-black text-zinc-900">{p.name}</p>
                  <p className="text-sm text-zinc-500 font-bold">@{p.username}</p>
                  {p.registeredAt && <p className="text-xs text-zinc-400 mt-1">{p.registeredAt}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => handleApprove(p)} className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700">
                    <UserCheck className="w-4 h-4" /> Aprobar
                  </button>
                  <button type="button" onClick={() => handleReject(p)} className="inline-flex items-center gap-1.5 bg-white border border-red-200 text-red-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-red-50">
                    <UserX className="w-4 h-4" /> Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'members' && (
        <div className="space-y-3">
          {members.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
              <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 font-bold">No hay cuentas registradas.</p>
            </div>
          ) : members.map((u) => (
            <div key={u.username} className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-black text-zinc-900">{u.name}</p>
                  {u.blocked && (
                    <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Bloqueado</span>
                  )}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>
                    {u.role === 'admin' ? 'Admin' : 'Miembro'}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 font-bold mt-0.5">@{u.username}</p>
              </div>
              {isSuperadmin && (
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => { setResetTarget(u); setNewPwd(''); setShowResetPwd(false) }}
                    title="Restablecer contraseña"
                    className="inline-flex items-center gap-1.5 bg-white border border-amber-200 text-amber-700 px-3 py-2 rounded-xl font-bold text-sm hover:bg-amber-50"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBlock(u)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm border ${u.blocked ? 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50' : 'bg-white border-red-200 text-red-700 hover:bg-red-50'}`}
                  >
                    {u.blocked ? <><Shield className="w-4 h-4" /> Desbloquear</> : <><ShieldOff className="w-4 h-4" /> Bloquear</>}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminUsersView
