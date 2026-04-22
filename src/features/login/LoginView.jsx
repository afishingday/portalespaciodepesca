import { useState, useEffect } from 'react'
import {
  AlertCircle, User, Lock, Eye, EyeOff, ChevronRight, CheckCircle2,
  Fish, Phone, UserPlus, ArrowLeft, Scale,
} from 'lucide-react'
import LegalNoticeModal from '../legal/LegalNoticeModal.jsx'
import { checkStrongPassword } from '../../shared/utils.js'
import { passwordChangeErrorMessage } from '../../shared/portalErrors.js'
import { TENANT } from '../../tenant.config.js'
import { BRAND_LOGO_SRC } from '../../brandAssets.js'
import { updateUserPlainPassword, addPendingUser, appendLog } from '../../firestore/portalData.js'

const LoginView = ({ db, onLogin, onGuestLogin }) => {
  const [legalOpen, setLegalOpen] = useState(false)
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Register form
  const [regName, setRegName] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regPhone, setRegPhone] = useState('')

  // Change password form
  const [cpUser, setCpUser] = useState('')
  const [cpCurrent, setCpCurrent] = useState('')
  const [pwNext, setPwNext] = useState('')
  const [pwAgain, setPwAgain] = useState('')
  const [showCpCurrent, setShowCpCurrent] = useState(false)
  const [showCpNext, setShowCpNext] = useState(false)
  const [showCpAgain, setShowCpAgain] = useState(false)
  const [pwBusy, setPwBusy] = useState(false)

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')
    const usernameClean = username.trim()
    const foundUser = db.users?.find((u) => u.username?.toLowerCase() === usernameClean.toLowerCase())
    if (!foundUser) return setError('Usuario no encontrado. Verifica que lo hayas escrito correctamente.')
    if (foundUser.blocked) return setError('Tu usuario está bloqueado. Contacta a un administrador del portal.')
    if (foundUser.password !== password) return setError('Contraseña incorrecta.')
    onLogin({
      username: foundUser.username,
      name: foundUser.name,
      role: foundUser.role,
      password,
      avatar: foundUser.avatar || '',
      phone: foundUser.phone || '',
    })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!regName || !regUsername || !regPhone) return setError('Todos los campos son obligatorios.')
    const clean = regUsername.trim()

    const exists =
      db.users?.find((u) => u.username?.toLowerCase() === clean.toLowerCase()) ||
      db.pendingUsers?.find((u) => u.username?.toLowerCase() === clean.toLowerCase())
    if (exists) return setError('Ese nombre de usuario ya está en uso o en revisión.')

    try {
      const pending = {
        id: Date.now(),
        name: regName.trim(),
        username: clean,
        phone: regPhone.trim(),
        date: new Date().toLocaleDateString('es-CO'),
      }
      await addPendingUser(pending)
      setSuccessMsg(
        'Solicitud enviada. Cuando un administrador la apruebe, tu usuario quedará activo con la contraseña inicial acordada para nuevas cuentas (te la comunicarán al aceptarte).',
      )
      setMode('login')
      setRegName('')
      setRegUsername('')
      setRegPhone('')
    } catch (err) {
      console.error(err)
      setError('No se pudo enviar la solicitud. Verifica tu conexión.')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    const usernameClean = cpUser.trim()
    const foundUser = db.users?.find((u) => u.username?.toLowerCase() === usernameClean.toLowerCase())
    if (!foundUser) return setError('Usuario no encontrado.')
    if (foundUser.blocked) return setError('Tu usuario está bloqueado. Contacta al administrador.')
    if (!cpCurrent) return setError('Escribe tu contraseña actual.')
    if (pwNext !== pwAgain) return setError('La nueva contraseña y su repetición no coinciden.')
    const strong = checkStrongPassword(pwNext.trim())
    if (!strong.ok) return setError('La nueva clave debe tener mínimo 8 caracteres e incluir letras y números.')
    setPwBusy(true)
    try {
      await updateUserPlainPassword(foundUser.username, cpCurrent, pwNext.trim())
      void appendLog({
        user: foundUser.username,
        action: 'CAMBIAR_CONTRASENA',
        details: 'Cambió contraseña desde la pantalla de inicio (sin sesión activa)',
        timestamp: new Date().toLocaleString('es-CO'),
      }).catch(console.error)
      setMode('login')
      setCpUser('')
      setCpCurrent('')
      setPwNext('')
      setPwAgain('')
      setSuccessMsg('Contraseña actualizada. Ya puedes ingresar con tu nueva clave.')
    } catch (err) {
      setError(passwordChangeErrorMessage(err))
    } finally {
      setPwBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-portal-canvas flex flex-col">
      <LegalNoticeModal open={legalOpen} onClose={() => setLegalOpen(false)} />
      <div className="flex-1 flex justify-center items-center p-4">
        <div className="w-full max-w-md bg-white/95 rounded-[2rem] shadow-xl shadow-blue-100/40 overflow-hidden border border-blue-100/50">
          <div className="bg-black flex flex-col items-center justify-center text-center text-white min-h-[220px] px-6 py-10 relative overflow-hidden">
            {BRAND_LOGO_SRC ? (
              <img src={BRAND_LOGO_SRC} alt="" className="h-28 w-auto max-w-[min(280px,85%)] object-contain relative z-10 drop-shadow-lg mx-auto" />
            ) : (
              <Fish className="w-16 h-16 text-cyan-400 mb-4 relative z-10 drop-shadow-md" strokeWidth={1.5} />
            )}
            <h1 className={`text-2xl font-black tracking-tight relative z-10 ${BRAND_LOGO_SRC ? 'mt-4' : ''}`}>{TENANT.name}</h1>
            <p className="text-blue-300 text-xs mt-2 font-black tracking-[0.18em] uppercase relative z-10 max-w-xs leading-relaxed">
              {TENANT.slogan}
            </p>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center text-sm mb-5 border border-red-100">
                <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center text-sm mb-5 border border-green-100">
                <CheckCircle2 className="w-5 h-5 mr-2 shrink-0" />
                {successMsg}
              </div>
            )}

            {mode === 'login' && (
              <div className="animate-in fade-in">
                <p className="text-zinc-500 text-sm text-center mb-6 font-medium">
                  Acceso con cuenta aprobada. Participar aquí no implica membresía de asociación ni club constituido.
                </p>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-4 top-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Usuario (ej. JuanPescador)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-12 p-4 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-4 top-4 text-zinc-400" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 p-4 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-4 top-4 text-zinc-400 hover:text-blue-600"
                      aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white p-4 rounded-xl font-black hover:bg-blue-700 flex justify-center items-center transition-all shadow-lg shadow-blue-600/20"
                  >
                    Ingresar al portal <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                </form>
                <div className="mt-6 pt-6 border-t border-zinc-100 space-y-3">
                  <button
                    type="button"
                    onClick={onGuestLogin}
                    className="w-full bg-zinc-50 border border-zinc-200 text-zinc-700 p-3 rounded-xl font-bold hover:bg-zinc-100 transition-colors flex justify-center items-center text-sm"
                  >
                    <Eye className="w-4 h-4 mr-2 text-zinc-400" /> Ver contenido como Invitado
                  </button>
                  <div className="flex justify-between text-xs font-bold text-zinc-400">
                    <button
                      type="button"
                      onClick={() => { setError(''); setSuccessMsg(''); setMode('register') }}
                      className="hover:text-blue-600 transition-colors"
                    >
                      ¿Sin cuenta? Solicita acceso
                    </button>
                    <button
                      type="button"
                      onClick={() => { setError(''); setSuccessMsg(''); setMode('change') }}
                      className="hover:text-blue-600 transition-colors"
                    >
                      Cambiar contraseña
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in">
                <h3 className="text-lg font-black text-zinc-900 mb-4">Solicitar acceso al portal</h3>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-4 top-4 text-zinc-400" />
                  <input
                    required
                    type="text"
                    placeholder="Nombre completo"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-12 p-4 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div className="relative">
                  <UserPlus className="w-5 h-5 absolute left-4 top-4 text-zinc-400" />
                  <input
                    required
                    type="text"
                    placeholder="Usuario deseado (Ej. JuanPescador)"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full pl-12 p-4 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-4 top-4 text-zinc-400" />
                  <input
                    required
                    type="tel"
                    placeholder="Número de celular"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-12 p-4 rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white p-4 rounded-xl font-black hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                >
                  Enviar Solicitud
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full text-sm font-bold text-zinc-500 hover:text-blue-600 flex items-center justify-center mt-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Volver al ingreso
                </button>
              </form>
            )}

            {mode === 'change' && (
              <div className="animate-in fade-in">
                <h3 className="text-lg font-black text-zinc-900 mb-4">Cambiar Contraseña</h3>
                <p className="text-xs text-zinc-500 mb-4">Mínimo 8 caracteres con letras y números.</p>
                <form onSubmit={(e) => void handleChangePassword(e)} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Tu usuario"
                    value={cpUser}
                    onChange={(e) => setCpUser(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="relative">
                    <input
                      type={showCpCurrent ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Contraseña actual"
                      value={cpCurrent}
                      onChange={(e) => setCpCurrent(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 pr-11 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCpCurrent((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-600 p-0.5"
                      aria-label={showCpCurrent ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                    >
                      {showCpCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showCpNext ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Nueva contraseña"
                      value={pwNext}
                      onChange={(e) => setPwNext(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 pr-11 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCpNext((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-600 p-0.5"
                      aria-label={showCpNext ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                    >
                      {showCpNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showCpAgain ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Repetir nueva contraseña"
                      value={pwAgain}
                      onChange={(e) => setPwAgain(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 pr-11 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCpAgain((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-600 p-0.5"
                      aria-label={showCpAgain ? 'Ocultar repetición de contraseña' : 'Mostrar repetición de contraseña'}
                    >
                      {showCpAgain ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={pwBusy}
                    className="w-full rounded-xl bg-blue-600 text-white py-3 font-bold text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {pwBusy ? 'Guardando…' : 'Guardar nueva contraseña'}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full text-sm font-bold text-zinc-500 hover:text-blue-600 flex items-center justify-center mt-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Volver al ingreso
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="text-center text-xs text-zinc-500 py-5 px-6 border-t border-zinc-100 space-y-3">
        <button
          type="button"
          onClick={() => setLegalOpen(true)}
          className="inline-flex items-center gap-1.5 font-black text-amber-900 hover:text-amber-950 underline decoration-amber-400/80 underline-offset-2"
        >
          <Scale className="w-3.5 h-3.5 shrink-0" aria-hidden />
          Aviso legal – Espacio de Pesca
        </button>
        <p className="max-w-sm mx-auto leading-relaxed">
          Portal de uso restringido a cuentas registradas y aprobadas en {TENANT.locationDescription}. No es un club deportivo constituido ni implica membresía asociativa. El acceso no autorizado está prohibido.
        </p>
      </footer>
    </div>
  )
}

export default LoginView
