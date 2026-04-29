import { useState } from 'react'
import {
  Users, UserCheck, UserX, UserCircle, Shield, ShieldOff, KeyRound, Clock, Loader2, Eye, EyeOff, Layers, X,
} from 'lucide-react'
import PortalAdminSettingsPanel from './PortalAdminSettingsPanel.jsx'
import { DEFAULT_APPROVED_MEMBER_PASSWORD } from '../../shared/portalAuthConstants.js'
import { isAdminLike } from '../../shared/utils.js'
import { TENANT } from '../../tenant.config.js'
import PortalUserAvatar from '../../shared/PortalUserAvatar.jsx'
import { sanitizePortalUsernameInput, validatePortalUsername } from '../../shared/portalUsername.js'

const AdminUsersView = ({
  currentUser,
  db,
  approvePendingUser,
  rejectPendingUser,
  setUserBlockedStatus,
  updateUserProfile,
  logAction,
  showAlert,
  showConfirm,
  onOpenPortalSections,
  savePublicSettings,
  getStorageUsage,
}) => {
  const [tab, setTab] = useState('pending')
  const [resetTarget, setResetTarget] = useState(null)
  const [newPwd, setNewPwd] = useState('')
  const [showResetPwd, setShowResetPwd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileDetail, setProfileDetail] = useState(null)
  const isSuperadmin = currentUser.role === 'superadmin'
  const canManageUsers = isAdminLike(currentUser)

  const pending = db.pendingUsers || []
  const members = (db.users || []).filter((u) => u.role !== 'superadmin')

  const handleApprove = (p) => {
    const clean = sanitizePortalUsernameInput(String(p.username ?? '').trim())
    const v = validatePortalUsername(clean)
    if (!v.ok) {
      showAlert(
        `No se puede aprobar esta solicitud: ${v.message} Recházala y pide al solicitante que vuelva a registrarse con un usuario válido.`,
      )
      return
    }
    showConfirm(`¿Aprobar la cuenta de ${p.name} (${v.username}) en el portal?`, async () => {
      try {
        const newUser = {
          username: v.username,
          name: p.name,
          password: DEFAULT_APPROVED_MEMBER_PASSWORD,
          role: 'member',
          blocked: false,
          avatar: '',
          phone: String(p.phone ?? '').trim(),
        }
        await approvePendingUser(p.id, newUser)
        logAction?.('APROBAR_SOCIO', v.username)
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
        const logKey = u.blocked ? 'DESBLOQUEO_USUARIO' : 'BLOQUEO_USUARIO'
        logAction?.(logKey, `${isSuperadmin ? 'superadmin' : 'admin'}:${u.username}`)
        showAlert(`Usuario ${u.blocked ? 'desbloqueado' : 'bloqueado'}.`)
        setProfileDetail((p) => (p && p.username === u.username ? { ...p, blocked: !u.blocked } : p))
      } catch { showAlert('No se pudo cambiar el estado.') }
    })
  }

  const handleResetPwd = async () => {
    if (!newPwd.trim() || newPwd.trim().length < 6) return showAlert('La contraseña debe tener al menos 6 caracteres.')
    setSaving(true)
    try {
      await updateUserProfile(resetTarget.username, { password: newPwd.trim() })
      logAction?.('RESET_CLAVE_USUARIO', `${isSuperadmin ? 'superadmin' : 'admin'}:${resetTarget.username}`)
      showAlert(`Contraseña de ${resetTarget.name} restablecida.`)
      setResetTarget(null)
      setNewPwd('')
      setShowResetPwd(false)
    } catch { showAlert('No se pudo restablecer la contraseña.') } finally { setSaving(false) }
  }

  const handleRoleChange = (u, nextRole) => {
    if (!isSuperadmin || nextRole === u.role) return
    if (u.username === currentUser.username) return showAlert('No puedes cambiar tu propio rol desde aquí.')
    const label = nextRole === 'admin' ? 'administrador' : 'miembro'
    showConfirm(`¿Cambiar el rol de ${u.name} a ${label}?`, async () => {
      try {
        await updateUserProfile(u.username, { role: nextRole })
        logAction?.('SUPERADMIN_CAMBIO_ROL', `${u.username}→${nextRole}`)
        showAlert('Rol actualizado.')
        setProfileDetail((p) => (p && p.username === u.username ? { ...p, role: nextRole } : p))
      } catch { showAlert('No se pudo actualizar el rol.') }
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-black text-zinc-900">Administración</h2>
        <p className="text-zinc-500 mt-1">
          Herramientas de SuperAdmin, configuración del portal y administración de cuentas.
        </p>
      </div>

      {isSuperadmin && (
        <PortalAdminSettingsPanel
          currentUser={currentUser}
          currentUserRow={(db.users || []).find((u) => u.username === currentUser.username)}
          settingsRow={db.settings}
          savePublicSettings={savePublicSettings}
          updateUserProfile={updateUserProfile}
          getStorageUsage={getStorageUsage}
          logAction={logAction}
          showAlert={showAlert}
        />
      )}

      <div>
        <h3 className="text-xl font-black text-zinc-900">Administrar cuentas</h3>
        <p className="text-zinc-500 mt-1">
          {isSuperadmin
            ? 'Aprobaciones, roles, claves, bloqueo y ficha de cada persona (avatar del perfil). También puedes configurar el menú público del portal.'
            : 'Aprobaciones, restablecer claves, bloqueo y ficha de cada usuario. Cambiar el rol de alguien o el menú público del portal solo lo puede el superadmin.'}
        </p>
      </div>

      {isSuperadmin && typeof onOpenPortalSections === 'function' && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-blue-950">Menú público del portal</p>
            <p className="text-xs text-blue-900/80 mt-0.5">Activa u oculta secciones y el orden del menú que ven los usuarios.</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenPortalSections()}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 text-white px-4 py-2.5 text-sm font-black hover:bg-blue-800"
          >
            <Layers className="w-4 h-4" />
            Configurar secciones
          </button>
        </div>
      )}

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

      {profileDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/30 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl p-6 max-w-md w-full animate-in zoom-in-95 relative">
            <button
              type="button"
              onClick={() => setProfileDetail(null)}
              className="absolute right-4 top-4 p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center text-center pt-2 pb-4 border-b border-zinc-100">
              <PortalUserAvatar user={{ name: profileDetail.name, username: profileDetail.username, avatar: profileDetail.avatar }} sizeClass="w-20 h-20" textClass="text-2xl" roundedClass="rounded-2xl" />
              <p className="text-lg font-black text-zinc-900 mt-3">{profileDetail.name}</p>
              <p className="text-sm font-bold text-zinc-500">@{profileDetail.username}</p>
              <span className={`mt-2 text-xs font-black px-2.5 py-1 rounded-full ${profileDetail.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-zinc-100 text-zinc-700'}`}>
                {profileDetail.role === 'admin' ? 'Administrador' : 'Miembro'}
              </span>
              {profileDetail.blocked && (
                <span className="mt-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Cuenta bloqueada</span>
              )}
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="font-bold text-zinc-500">Teléfono</dt>
                <dd className="font-medium text-zinc-900 text-right">{String(profileDetail.phone ?? '').trim() || '—'}</dd>
              </div>
            </dl>
            {profileDetail.username === currentUser.username && (
              <p className="mt-4 text-xs text-zinc-500 text-center">
                Es tu propia cuenta. Para cambiar tu clave usa <span className="font-bold text-zinc-700">Perfil</span>.
                {isSuperadmin ? ' El rol de superadmin no se edita desde aquí.' : ''}
              </p>
            )}
            {isSuperadmin && profileDetail.username !== currentUser.username && profileDetail.username !== TENANT.superadminUsername && (
              <div className="mt-5">
                <label className="block text-xs font-black text-zinc-500 uppercase tracking-wide mb-1">Rol en el portal</label>
                <select
                  value={profileDetail.role === 'admin' ? 'admin' : 'member'}
                  onChange={(e) => handleRoleChange(profileDetail, e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 font-bold text-zinc-800"
                >
                  <option value="member">Miembro</option>
                  <option value="admin">Administrador</option>
                </select>
                <p className="mt-2 text-[11px] text-zinc-400">Solo el superadmin puede cambiar roles.</p>
              </div>
            )}
            {!isSuperadmin && profileDetail.username !== currentUser.username && (
              <p className="mt-5 text-xs text-zinc-500 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2">
                El rol se muestra solo como referencia. Para cambiarlo debe entrar el <span className="font-bold text-zinc-700">superadmin</span>.
              </p>
            )}
            {canManageUsers && profileDetail.username !== currentUser.username && (
              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => { setResetTarget(profileDetail); setNewPwd(''); setShowResetPwd(false); setProfileDetail(null) }}
                  className="w-full py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 font-black text-sm hover:bg-amber-100"
                >
                  Restablecer contraseña…
                </button>
                <button
                  type="button"
                  onClick={() => handleBlock(profileDetail)}
                  className={`w-full py-2.5 rounded-xl font-black text-sm border ${profileDetail.blocked ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-red-200 bg-red-50 text-red-800'}`}
                >
                  {profileDetail.blocked ? 'Desbloquear cuenta' : 'Bloquear cuenta'}
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setProfileDetail(null)}
              className="mt-6 w-full py-3 rounded-xl border border-zinc-200 font-bold text-zinc-700 hover:bg-zinc-50 text-sm"
            >
              Cerrar
            </button>
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
            <div key={u.username} className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col sm:flex-row items-start gap-4">
              <PortalUserAvatar user={{ name: u.name, username: u.username, avatar: u.avatar }} sizeClass="w-14 h-14" textClass="text-lg" roundedClass="rounded-2xl" />
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
                {String(u.phone ?? '').trim() && (
                  <p className="text-xs text-zinc-400 mt-1">Tel. {u.phone}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 shrink-0 w-full sm:w-auto sm:justify-end">
                {canManageUsers && (
                  <button
                    type="button"
                    onClick={() => setProfileDetail(u)}
                    className="inline-flex items-center gap-1.5 bg-white border border-zinc-200 text-zinc-800 px-3 py-2 rounded-xl font-bold text-sm hover:bg-zinc-50"
                  >
                    <UserCircle className="w-4 h-4" />
                    Ver ficha
                  </button>
                )}
                {canManageUsers && u.username !== currentUser.username && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminUsersView
