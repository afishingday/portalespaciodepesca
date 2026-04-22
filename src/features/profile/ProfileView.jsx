import { useState, useEffect, useMemo } from 'react'
import { Eye, EyeOff, Loader2, ImageIcon } from 'lucide-react'
import { checkStrongPassword, getAvatarById } from '../../shared/utils.js'
import { PROFILE_AVATAR_ICONS } from '../../shared/profileAvatarIcons.js'
import { passwordChangeErrorMessage } from '../../shared/portalErrors.js'

export default function ProfileView({
  currentUser,
  db,
  updateUserProfile,
  updateUserPlainPassword,
  onProfileSaved,
  onPasswordChanged,
  logAction,
  showAlert,
}) {
  const row = useMemo(
    () => (db.users || []).find((u) => u.username === currentUser.username),
    [db.users, currentUser.username],
  )

  const [name, setName] = useState(currentUser.name || '')
  const [phone, setPhone] = useState(currentUser.phone || '')
  const [avatarId, setAvatarId] = useState((currentUser.avatar || '').trim())
  const [savingProfile, setSavingProfile] = useState(false)

  const selectedAvatar = useMemo(
    () => getAvatarById(avatarId || row?.avatar || currentUser.avatar),
    [avatarId, row?.avatar, currentUser.avatar],
  )

  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNext, setPwNext] = useState('')
  const [pwAgain, setPwAgain] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [showPwCurrent, setShowPwCurrent] = useState(false)
  const [showPwNext, setShowPwNext] = useState(false)
  const [showPwAgain, setShowPwAgain] = useState(false)

  useEffect(() => {
    const u = (db.users || []).find((x) => x.username === currentUser.username)
    if (!u) return
    setName(u.name || '')
    setPhone(u.phone ?? '')
    setAvatarId((u.avatar || '').trim())
  }, [db.users, currentUser.username])

  const saveProfile = async (e) => {
    e.preventDefault()
    const n = name.trim()
    const ph = phone.trim()
    if (n.length < 2) return showAlert('El nombre debe tener al menos 2 caracteres.')
    if (n.length > 120) return showAlert('El nombre admite máximo 120 caracteres.')
    if (ph.length > 40) return showAlert('El teléfono admite máximo 40 caracteres.')
    setSavingProfile(true)
    try {
      await updateUserProfile(currentUser.username, { name: n, phone: ph, avatar: avatarId || '' })
      onProfileSaved?.({ name: n, phone: ph, avatar: avatarId || '' })
      logAction?.('ACTUALIZAR_PERFIL', 'Nombre, teléfono y avatar')
      showAlert('Perfil actualizado correctamente.')
    } catch {
      showAlert('No se pudo guardar el perfil.')
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (!pwCurrent) return showAlert('Escribe tu contraseña actual.')
    if (pwNext !== pwAgain) return showAlert('La nueva contraseña y la repetición no coinciden.')
    const strong = checkStrongPassword(pwNext.trim())
    if (!strong.ok) return showAlert('La nueva clave debe tener mínimo 8 caracteres e incluir letras y números.')
    setPwBusy(true)
    try {
      await updateUserPlainPassword(currentUser.username, pwCurrent, pwNext.trim())
      onPasswordChanged?.(pwNext.trim())
      setPwCurrent('')
      setPwNext('')
      setPwAgain('')
      logAction?.('CAMBIAR_CONTRASENA', 'Actualizó su contraseña desde Perfil')
      showAlert('Contraseña actualizada correctamente.')
    } catch (err) {
      showAlert(passwordChangeErrorMessage(err))
    } finally {
      setPwBusy(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in max-w-3xl mx-auto">
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
        <h2 className="text-2xl md:text-3xl font-black text-stone-900">Mi perfil</h2>
        <p className="text-stone-600 mt-1">Personaliza cómo te muestran en el portal.</p>
      </div>

      <form
        onSubmit={(e) => void saveProfile(e)}
        className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm space-y-5"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
            {selectedAvatar?.src ? (
              <img src={selectedAvatar.src} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-stone-400">{(name || currentUser.username).charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-stone-900 truncate">{currentUser.username}</p>
            <p className="text-xs text-stone-600">
              Cómo te ven quienes navegan el portal: <span className="font-bold text-stone-800">{name.trim() || currentUser.username}</span>
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-stone-800 mb-1">Usuario</label>
          <input
            value={currentUser.username}
            readOnly
            className="w-full border border-stone-200 p-3 rounded-xl bg-stone-100 text-stone-600 font-bold cursor-not-allowed text-sm"
          />
          <p className="text-[11px] text-stone-500 mt-1">Lo asignan los administradores al crear la cuenta; no se puede cambiar aquí.</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-stone-800 mb-1">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-stone-200 p-3 rounded-xl bg-stone-50 outline-none focus:border-emerald-400 text-sm font-medium"
            maxLength={120}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-stone-800 mb-1">Teléfono</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Celular o WhatsApp"
            className="w-full border border-stone-200 p-3 rounded-xl bg-stone-50 outline-none focus:border-emerald-400 text-sm font-medium"
            maxLength={40}
          />
        </div>

        <div>
          <div className="flex flex-wrap items-end justify-between gap-2 mb-2">
            <label className="block text-sm font-bold text-stone-800">Imagen de perfil</label>
            <span className="text-[11px] font-bold text-stone-500 bg-stone-100 border border-stone-200 rounded-lg px-2 py-0.5">
              {PROFILE_AVATAR_ICONS.length}{' '}
              {PROFILE_AVATAR_ICONS.length === 1 ? 'disponible' : 'disponibles'}
            </span>
          </div>

          {PROFILE_AVATAR_ICONS.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6 flex flex-col items-center text-center gap-2">
              <ImageIcon className="w-10 h-10 text-stone-400" strokeWidth={1.25} />
              <p className="text-sm font-bold text-stone-700">No hay imágenes de perfil disponibles</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3 sm:p-4">
                <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:overflow-visible sm:pb-0 sm:gap-3">
                  {PROFILE_AVATAR_ICONS.map((opt) => {
                    const on = avatarId === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAvatarId(opt.id)}
                        title={opt.filename}
                        className={`group relative aspect-square w-[min(30vw,5.75rem)] shrink-0 snap-center sm:w-auto sm:min-w-0 rounded-2xl border-2 overflow-hidden transition-all shadow-sm ${
                          on
                            ? 'border-emerald-500 ring-2 ring-emerald-400/50 ring-offset-2 ring-offset-stone-50 sm:scale-[1.02]'
                            : 'border-stone-200 hover:border-emerald-300 hover:shadow-md opacity-95 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={opt.src}
                          alt=""
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                        <span className="pointer-events-none absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/55 to-transparent pt-4 pb-1 px-1">
                          <span className="block text-[10px] font-black text-white text-center truncate">{opt.label}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAvatarId('')}
                className="mt-3 text-xs font-bold text-stone-600 hover:text-stone-800 underline"
              >
                Quitar imagen de perfil
              </button>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
          {savingProfile ? 'Guardando…' : 'Guardar perfil'}
        </button>
      </form>

      <form
        onSubmit={(e) => void savePassword(e)}
        className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm space-y-4"
      >
        <h3 className="text-lg font-black text-stone-900">Cambiar contraseña</h3>
        <div className="relative">
          <input
            type={showPwCurrent ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Contraseña actual"
            value={pwCurrent}
            onChange={(e) => setPwCurrent(e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-3 py-3 pr-10 text-sm font-medium outline-none focus:border-emerald-500 bg-stone-50"
          />
          <button
            type="button"
            onClick={() => setShowPwCurrent((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700"
            aria-label={showPwCurrent ? 'Ocultar' : 'Mostrar'}
          >
            {showPwCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="relative">
          <input
            type={showPwNext ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Nueva contraseña"
            value={pwNext}
            onChange={(e) => setPwNext(e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-3 py-3 pr-10 text-sm font-medium outline-none focus:border-emerald-500 bg-stone-50"
          />
          <button
            type="button"
            onClick={() => setShowPwNext((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700"
            aria-label={showPwNext ? 'Ocultar' : 'Mostrar'}
          >
            {showPwNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="relative">
          <input
            type={showPwAgain ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Repetir nueva contraseña"
            value={pwAgain}
            onChange={(e) => setPwAgain(e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-3 py-3 pr-10 text-sm font-medium outline-none focus:border-emerald-500 bg-stone-50"
          />
          <button
            type="button"
            onClick={() => setShowPwAgain((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700"
            aria-label={showPwAgain ? 'Ocultar' : 'Mostrar'}
          >
            {showPwAgain ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-stone-600">La clave debe tener mínimo 8 caracteres e incluir letras y números.</p>
        <button
          type="submit"
          disabled={pwBusy}
          className="bg-stone-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-stone-800 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {pwBusy && <Loader2 className="w-4 h-4 animate-spin" />}
          {pwBusy ? 'Guardando…' : 'Guardar nueva contraseña'}
        </button>
      </form>

      {row?.role && (
        <p className="text-xs text-stone-500 font-medium text-center">
          Rol en el portal: <span className="font-black text-stone-700">{row.role}</span>
        </p>
      )}
    </div>
  )
}
