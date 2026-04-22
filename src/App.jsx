import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Newspaper, BookMarked, Megaphone, CheckSquare, CalendarDays, Trophy,
  Video, Fish, BookOpen, Users, ScrollText, Layers,
  Menu, X, Info, AlertCircle, Loader2, LogOut, KeyRound, Eye, EyeOff,
  Handshake, MapPinned, UserCircle, Scale,
} from 'lucide-react'
import { EMPTY_DB } from './initialData.js'
import {
  subscribePortalDb,
  seedFirestoreIfEmpty,
  seedFishingDirectoryIfEmpty,
  syncUsersIfNeeded,
  migrateLegacyApprovedPasswordIfNeeded,
  appendLog,
  addNewsPost,
  updateNewsPost,
  deleteNewsPost,
  saveProposal,
  deleteProposal,
  convertProposalToPoll,
  convertProposalToEvent,
  savePoll,
  deletePoll,
  saveEvent,
  deleteEvent,
  saveRecord,
  deleteRecord,
  saveTalk,
  deleteTalk,
  saveBitacoraEntry,
  deleteBitacoraEntry,
  saveCommunityPost,
  deleteCommunityPost,
  saveDirectoryEntry,
  deleteDirectoryEntry,
  approvePendingUser,
  rejectPendingUser,
  setUserBlockedStatus,
  updateUserProfile,
  updateUserPlainPassword,
  updatePortalSectionSettings,
} from './firestore/portalData.js'
import { savePortalSession, clearPortalSession, readPortalSession } from './portalSession.js'
import { setPortalAnalyticsUser, trackPortalEvent } from './analytics.js'
import PortalUserAvatar from './shared/PortalUserAvatar.jsx'
import {
  mergeSectionVisibility,
  mergeSectionOrder,
  isPortalContentSection,
  PORTAL_SECTION_LABELS,
} from './shared/portalSectionConfig.js'
import { passwordChangeErrorMessage } from './shared/portalErrors.js'
import { checkStrongPassword } from './shared/utils.js'
import { TENANT } from './tenant.config.js'
import { BRAND_LOGO_SRC } from './brandAssets.js'
import { useLocalPortalData } from './firebase.js'
import ErrorBoundary from './shared/ErrorBoundary.jsx'
import PortalFooter from './shared/PortalFooter.jsx'
import LoginView from './features/login/LoginView.jsx'
import NewsView from './features/news/NewsView.jsx'
import ProposalsView from './features/proposals/ProposalsView.jsx'
import PollsView from './features/polls/PollsView.jsx'
import EventsView from './features/events/EventsView.jsx'
import RecordsView from './features/records/RecordsView.jsx'
import TalksView from './features/talks/TalksView.jsx'
import SpeciesView from './features/species/SpeciesView.jsx'
import BitacoraView from './features/bitacora/BitacoraView.jsx'
import CommunityView from './features/community/CommunityView.jsx'
import DirectoryView from './features/directory/DirectoryView.jsx'
import AdminUsersView from './features/admin/AdminUsersView.jsx'
import LogsView from './features/logs/LogsView.jsx'
import SectionVisibilityView from './features/admin/SectionVisibilityView.jsx'
import ProfileView from './features/profile/ProfileView.jsx'
import { isPortalDefaultPassword } from './shared/portalAuthConstants.js'
import PescaColombiaView from './features/pescaColombia/PescaColombiaView.jsx'
import LegalNoticeView from './features/legal/LegalNoticeView.jsx'

const FORCE_PWD_EXEMPT = new Set(TENANT.forcePwdExempt)

const SECTION_NAV_ICONS = {
  news: Newspaper,
  pescaColombia: BookMarked,
  proposals: Megaphone,
  polls: CheckSquare,
  events: CalendarDays,
  records: Trophy,
  talks: Video,
  species: Fish,
  bitacora: BookOpen,
  community: Handshake,
  directory: MapPinned,
  legal: Scale,
}

function contentNavItemForSectionId(id) {
  const Icon = SECTION_NAV_ICONS[id]
  if (!Icon) return null
  const item = { id, label: PORTAL_SECTION_LABELS[id] || id, icon: Icon }
  if (id === 'talks' || id === 'community') item.membersOnly = true
  return item
}

function ForcePwdModal({ currentUser, onSuccess, onLogout }) {
  const [current, setCurrent] = useState('')
  const [next1, setNext1] = useState('')
  const [next2, setNext2] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext1, setShowNext1] = useState(false)
  const [showNext2, setShowNext2] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    if (next1 !== next2) return setErr('Las contraseñas no coinciden.')
    const strong = checkStrongPassword(next1)
    if (!strong.ok) return setErr('La nueva clave debe tener mínimo 8 caracteres e incluir letras y números.')
    setSaving(true)
    try {
      await updateUserPlainPassword(currentUser.username, current, next1)
      savePortalSession(currentUser.username, next1)
      onSuccess()
    } catch (ex) {
      setErr(passwordChangeErrorMessage(ex))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl p-6 md:p-8 max-w-md w-full animate-in zoom-in-95">
        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="w-8 h-8 text-blue-500 shrink-0" />
          <div>
            <h3 className="text-xl font-black text-zinc-900">Cambia tu contraseña</h3>
            <p className="text-sm text-zinc-500">Debes establecer una contraseña personal.</p>
            <p className="text-xs text-zinc-400 mt-2 leading-snug">
              El primer campo es tu <span className="font-bold text-zinc-600">clave con la que entras hoy</span>, no tu nombre de usuario ni la etiqueta «Super Admin».
            </p>
          </div>
        </div>
        {err && <p className="mb-3 text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{err}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              required
              type={showCurrent ? 'text' : 'password'}
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Contraseña actual"
              className="w-full p-3 pr-11 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-600 p-0.5"
              aria-label={showCurrent ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
            >
              {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="relative">
            <input
              required
              type={showNext1 ? 'text' : 'password'}
              autoComplete="new-password"
              value={next1}
              onChange={(e) => setNext1(e.target.value)}
              placeholder="Nueva contraseña (mín. 8 caracteres)"
              className="w-full p-3 pr-11 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowNext1((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-600 p-0.5"
              aria-label={showNext1 ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
            >
              {showNext1 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="relative">
            <input
              required
              type={showNext2 ? 'text' : 'password'}
              autoComplete="new-password"
              value={next2}
              onChange={(e) => setNext2(e.target.value)}
              placeholder="Confirmar nueva contraseña"
              className="w-full p-3 pr-11 border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowNext2((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-600 p-0.5"
              aria-label={showNext2 ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
            >
              {showNext2 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onLogout} className="flex-1 py-3 rounded-xl border border-zinc-200 font-bold text-zinc-700 hover:bg-zinc-50 text-sm">
              Salir
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PortalApp() {
  const [db, setDb] = useState(EMPTY_DB)
  const [dataReady, setDataReady] = useState(false)
  const [sessionRehydrated, setSessionRehydrated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [activeTab, setActiveTab] = useState('news')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [mustChangePwd, setMustChangePwd] = useState(false)

  useEffect(() => {
    let unsub = () => {}
    let cancelled = false
    ;(async () => {
      try {
        await seedFirestoreIfEmpty()
        await seedFishingDirectoryIfEmpty()
        await syncUsersIfNeeded()
        await migrateLegacyApprovedPasswordIfNeeded()
      } catch (err) {
        console.error(err)
      }
      if (cancelled) return
      unsub = subscribePortalDb(setDb, () => {
        if (!cancelled) setDataReady(true)
      })
    })()
    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  useEffect(() => {
    if (!dataReady) return
    const raw = readPortalSession()
    if (!raw) { setSessionRehydrated(true); return }
    const users = db.users ?? []
    if (users.length === 0) {
      const t = window.setTimeout(() => setSessionRehydrated(true), 2000)
      return () => window.clearTimeout(t)
    }
    try {
      const { username, password } = raw
      const user = users.find((u) => u.username === username && u.password === password)
      if (user && !user.blocked) {
        setCurrentUser({
          username: user.username,
          name: user.name,
          role: user.role,
          avatar: user.avatar || '',
          phone: user.phone || '',
        })
        if (!FORCE_PWD_EXEMPT.has(user.username) && isPortalDefaultPassword(user.username, user.password)) {
          setMustChangePwd(true)
        }
      } else {
        clearPortalSession()
      }
    } catch {
      clearPortalSession()
    }
    setSessionRehydrated(true)
  }, [dataReady, db.users])

  useEffect(() => {
    if (!dataReady || !currentUser?.username || currentUser.role === 'guest') return
    const row = (db.users || []).find((u) => u.username === currentUser.username)
    if (!row) return
    if (FORCE_PWD_EXEMPT.has(row.username)) {
      setMustChangePwd(false)
      return
    }
    const sess = readPortalSession()
    const pwdForCheck =
      row.password !== undefined && row.password !== null && String(row.password) !== ''
        ? row.password
        : sess && sess.username === row.username
          ? sess.password
          : null
    if (pwdForCheck == null || pwdForCheck === '') return
    if (isPortalDefaultPassword(row.username, pwdForCheck)) setMustChangePwd(true)
    else setMustChangePwd(false)
  }, [dataReady, db.users, currentUser?.username, currentUser?.role])

  const logAction = useCallback((action, details) => {
    if (!currentUser) return
    appendLog({
      user: currentUser.username,
      action,
      details,
      timestamp: new Date().toLocaleString('es-CO'),
    }).catch(console.error)
    void trackPortalEvent('portal_action', {
      action_name: String(action || '').slice(0, 40),
      role: currentUser.role || 'unknown',
    })
  }, [currentUser])

  useEffect(() => { void setPortalAnalyticsUser(currentUser) }, [currentUser])

  useEffect(() => {
    if (!currentUser?.username) return
    void trackPortalEvent('portal_tab_view', {
      tab_name: String(activeTab || '').slice(0, 40),
      role: currentUser.role || 'unknown',
    })
  }, [activeTab, currentUser?.username, currentUser?.role])

  const sectionVisibility = useMemo(() => mergeSectionVisibility(db.settings?.sections), [db.settings?.sections])
  const sectionOrder = useMemo(() => mergeSectionOrder(db.settings?.sectionOrder), [db.settings?.sectionOrder])
  const contentNav = useMemo(
    () => sectionOrder.map((id) => contentNavItemForSectionId(id)).filter(Boolean),
    [sectionOrder],
  )

  useEffect(() => {
    if (!isPortalContentSection(activeTab)) return
    if (sectionVisibility[activeTab] !== false) return
    const next = sectionOrder.find((id) => sectionVisibility[id] !== false)
    if (next) setActiveTab(next)
    else if (currentUser?.role === 'superadmin') setActiveTab('sections')
    else if (currentUser?.role === 'admin') setActiveTab('admin')
  }, [activeTab, sectionVisibility, sectionOrder, currentUser?.role])

  useEffect(() => {
    if (currentUser?.role !== 'guest') return
    if (activeTab !== 'talks' && activeTab !== 'community') return
    const next =
      sectionOrder.find(
        (id) => id !== 'talks' && id !== 'community' && sectionVisibility[id] !== false,
      ) || 'news'
    setActiveTab(next)
  }, [currentUser?.role, activeTab, sectionVisibility, sectionOrder])

  const showAlert = useCallback((message) => setDialog({ type: 'alert', message }), [])
  const showConfirm = useCallback((message, onConfirm) => setDialog({ type: 'confirm', message, onConfirm }), [])

  if (!dataReady || !sessionRehydrated) {
    return (
      <div className="min-h-screen bg-portal-canvas flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-900 animate-spin mx-auto mb-4" aria-hidden />
          <p className="text-zinc-700 font-bold">
            {!dataReady
              ? useLocalPortalData
                ? 'Cargando datos de demostración…'
                : 'Sincronizando con la base de datos…'
              : 'Restaurando sesión…'}
          </p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <LoginView
        db={db}
        onLogin={(user) => {
          savePortalSession(user.username, user.password)
          setCurrentUser({
            username: user.username,
            name: user.name,
            role: user.role,
            avatar: user.avatar || '',
            phone: user.phone || '',
          })
          void trackPortalEvent('portal_login', { role: user.role || 'unknown' })
          appendLog({
            user: user.username,
            action: 'LOGIN',
            details: 'Ingreso al portal',
            timestamp: new Date().toLocaleString('es-CO'),
          }).catch(console.error)
          if (!FORCE_PWD_EXEMPT.has(user.username) && isPortalDefaultPassword(user.username, user.password)) {
            setMustChangePwd(true)
          }
        }}
        onGuestLogin={() => {
          setCurrentUser({ username: 'guest', name: 'Visitante', role: 'guest', avatar: '', phone: '' })
        }}
      />
    )
  }

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin'
  const isSuperadmin = currentUser.role === 'superadmin'
  const pendingCount = (db.pendingUsers || []).length

  const menu = [
    ...contentNav.filter((item) => {
      if (sectionVisibility[item.id] === false) return false
      if (item.membersOnly && currentUser.role === 'guest') return false
      return true
    }),
    ...(currentUser.role !== 'guest' ? [{ id: 'profile', label: 'Mi perfil', icon: UserCircle }] : []),
    ...(isAdmin ? [{ id: 'admin', label: 'Cuentas', icon: Users }] : []),
    ...(isSuperadmin
      ? [
          { id: 'logs', label: 'Actividad', icon: ScrollText },
          { id: 'sections', label: 'Secciones', icon: Layers },
        ]
      : []),
  ]

  const logout = () => {
    void trackPortalEvent('portal_logout', { role: currentUser?.role || 'unknown' })
    clearPortalSession()
    setCurrentUser(null)
    setMustChangePwd(false)
    setActiveTab('news')
  }

  const handleRegisterRequest = () => {
    clearPortalSession()
    setCurrentUser(null)
  }

  return (
    <div className="min-h-screen bg-portal-canvas flex font-sans text-zinc-900 relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 -left-28 h-96 w-96 rounded-full bg-blue-900/15 blur-3xl" />
        <div className="absolute top-1/3 -right-28 h-96 w-96 rounded-full bg-green-700/12 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-blue-700/10 blur-3xl" />
      </div>

      {dialog && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-blue-950/[0.12] backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="portal-dialog-title"
        >
          <div className="relative max-w-md w-full rounded-[2rem] border border-blue-200/70 bg-gradient-to-b from-white via-white to-blue-50/45 p-6 shadow-2xl shadow-blue-200/35 ring-1 ring-white/90 md:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center mb-4">
              {dialog.type === 'alert' ? (
                <Info className="w-8 h-8 text-sky-500 mr-3 shrink-0" aria-hidden />
              ) : (
                <AlertCircle className="w-8 h-8 text-amber-500 mr-3 shrink-0" aria-hidden />
              )}
              <h3 id="portal-dialog-title" className="text-2xl font-black text-zinc-900">
                {dialog.type === 'alert' ? 'Aviso' : 'Confirmar acción'}
              </h3>
            </div>
            <p className="mb-8 text-lg font-medium leading-snug text-zinc-600">{dialog.message}</p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              {dialog.type === 'confirm' && (
                <button
                  type="button"
                  onClick={() => setDialog(null)}
                  className="w-full rounded-xl border border-blue-200/80 bg-white px-6 py-3 font-bold text-zinc-800 shadow-sm transition-colors hover:bg-blue-50/80 sm:w-auto"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (dialog.type === 'confirm' && dialog.onConfirm) {
                    const run = dialog.onConfirm
                    setDialog(null)
                    queueMicrotask(() => run())
                  } else {
                    setDialog(null)
                  }
                }}
                className={`px-8 py-3 rounded-xl font-black text-white shadow-md transition-colors w-full sm:w-auto ${
                  dialog.type === 'alert'
                    ? 'bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-950 hover:to-blue-800'
                    : 'bg-gradient-to-r from-green-700 to-blue-800 hover:from-green-800 hover:to-blue-900'
                }`}
              >
                {dialog.type === 'alert' ? 'Entendido' : 'Sí, continuar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mustChangePwd && (
        <ForcePwdModal
          currentUser={currentUser}
          onSuccess={() => {
            setMustChangePwd(false)
            logAction('CAMBIAR_CONTRASENA', 'Cambio de clave obligatorio en primer ingreso')
          }}
          onLogout={logout}
        />
      )}

      {isMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 border-0 bg-blue-950/[0.14] p-0 backdrop-blur-[2px] md:hidden cursor-pointer w-full h-full"
          aria-label="Cerrar menú"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white/92 backdrop-blur supports-[backdrop-filter]:bg-white/85 border-r border-blue-100/50 z-50 transform transition-transform duration-300 ease-out md:relative md:translate-x-0 flex flex-col shadow-sm ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative border-b border-zinc-800 bg-black px-4 pt-6 pb-5 md:px-5">
          <button
            type="button"
            className="md:hidden absolute right-3 top-3 z-10 bg-zinc-800 border border-zinc-700 p-2 rounded-xl text-white hover:bg-zinc-700"
            onClick={() => setIsMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center text-center pt-1 md:pt-0">
            {BRAND_LOGO_SRC ? (
              <img
                src={BRAND_LOGO_SRC}
                alt={TENANT.name}
                className="max-h-[4.5rem] w-auto max-w-[220px] object-contain mx-auto mb-3"
              />
            ) : (
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-black/40 mb-3">
                <Fish className="w-8 h-8 text-white" />
              </div>
            )}
            <h1 className="text-sm font-black text-white leading-tight tracking-tight">{TENANT.name}</h1>
            <p className="text-[11px] text-blue-300 font-bold mt-1.5 leading-snug max-w-[14rem]">{TENANT.slogan}</p>
          </div>
        </div>

        <nav className="p-4 flex-1 space-y-1 overflow-y-auto">
          {menu.map((item) => {
            const hasBadge = item.id === 'admin' && pendingCount > 0
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  void trackPortalEvent('portal_nav_click', { to_tab: String(item.id).slice(0, 40) })
                  setActiveTab(item.id)
                  setIsMenuOpen(false)
                }}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-900/8 text-blue-950 ring-1 ring-blue-300/50'
                    : 'text-zinc-700 hover:bg-white/70 hover:text-zinc-900'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 shrink-0 ${activeTab === item.id ? 'text-green-700' : 'text-zinc-400'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {hasBadge && (
                  <span className="bg-red-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {pendingCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="p-5 border-t border-blue-900/15 space-y-3 bg-gradient-to-t from-blue-950/5 to-transparent">
          <div className="flex items-center gap-3 min-w-0 mb-1">
            <PortalUserAvatar user={currentUser} sizeClass="w-10 h-10" textClass="text-sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-zinc-900 leading-tight truncate">{currentUser.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-0.5">
                {isSuperadmin ? 'Super Admin' : isAdmin ? 'Administrador' : currentUser.role === 'guest' ? 'Visitante' : 'Registrado'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full bg-white/60 border border-blue-100/40 text-zinc-800 py-3 rounded-xl font-bold flex items-center justify-center hover:bg-red-50/80 hover:text-red-600 transition-colors text-xs shadow-sm"
          >
            <LogOut className="w-4 h-4 mr-2" /> Salir
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-blue-100/45 p-4 flex items-center justify-between md:hidden shrink-0 z-30 sticky top-0">
          <button type="button" onClick={() => setIsMenuOpen(true)} className="bg-white/60 border border-blue-100/40 p-2 rounded-lg mr-3">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
            {BRAND_LOGO_SRC ? (
              <img src={BRAND_LOGO_SRC} alt="" className="h-9 w-auto max-w-[min(200px,42vw)] object-contain shrink-0" />
            ) : (
              <Fish className="w-6 h-6 text-green-700 shrink-0" />
            )}
            <h1 className="font-black text-zinc-800 text-sm leading-tight truncate">{TENANT.name}</h1>
          </div>
          <div className="ml-2 shrink-0">
            <PortalUserAvatar user={currentUser} sizeClass="w-9 h-9" textClass="text-xs" roundedClass="rounded-xl" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth flex flex-col">
          <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0">
            <div className="flex-1">
              {activeTab === 'pescaColombia' && (
                <PescaColombiaView
                  userRole={currentUser?.role}
                  onOpenSpeciesCatalog={() => {
                    setActiveTab('species')
                    setIsMenuOpen(false)
                  }}
                />
              )}
              {activeTab === 'news' && (
                <NewsView
                  currentUser={currentUser}
                  db={db}
                  addNewsPost={addNewsPost}
                  updateNewsPost={updateNewsPost}
                  deleteNewsPost={deleteNewsPost}
                  showAlert={showAlert}
                  showConfirm={showConfirm}
                />
              )}
              {activeTab === 'proposals' && (
                <ProposalsView
                  currentUser={currentUser}
                  db={db}
                  saveProposal={saveProposal}
                  deleteProposal={deleteProposal}
                  convertProposalToPoll={convertProposalToPoll}
                  convertProposalToEvent={convertProposalToEvent}
                  logAction={logAction}
                  showAlert={showAlert}
                  showConfirm={showConfirm}
                  onRegisterRequest={handleRegisterRequest}
                />
              )}
              {activeTab === 'polls' && (
                <PollsView
                  currentUser={currentUser}
                  db={db}
                  savePoll={savePoll}
                  deletePoll={deletePoll}
                  logAction={logAction}
                  showAlert={showAlert}
                  showConfirm={showConfirm}
                  onRegisterRequest={handleRegisterRequest}
                />
              )}
              {activeTab === 'events' && (
                <EventsView
                  currentUser={currentUser}
                  db={db}
                  saveEvent={saveEvent}
                  deleteEvent={deleteEvent}
                  logAction={logAction}
                  showAlert={showAlert}
                  showConfirm={showConfirm}
                />
              )}
              {activeTab === 'records' && (
                <RecordsView
                  currentUser={currentUser}
                  db={db}
                  saveRecord={saveRecord}
                  deleteRecord={deleteRecord}
                  logAction={logAction}
                  showAlert={showAlert}
                  showConfirm={showConfirm}
                />
              )}
              {activeTab === 'talks' && currentUser.role !== 'guest' && (
                <TalksView
                  currentUser={currentUser}
                  db={db}
                  saveTalk={saveTalk}
                  deleteTalk={deleteTalk}
                  logAction={logAction}
                  showAlert={showAlert}
                  showConfirm={showConfirm}
                />
              )}
              {activeTab === 'species' && <SpeciesView />}
              {activeTab === 'bitacora' && (
                <BitacoraView
                  currentUser={currentUser}
                  db={db}
                  saveBitacoraEntry={saveBitacoraEntry}
                  deleteBitacoraEntry={deleteBitacoraEntry}
                  logAction={logAction}
                  showAlert={showAlert}
                  showConfirm={showConfirm}
                />
              )}
              {activeTab === 'community' && currentUser.role !== 'guest' && (
                <CommunityView
                  currentUser={currentUser}
                  db={db}
                  saveCommunityPost={saveCommunityPost}
                  deleteCommunityPost={deleteCommunityPost}
                  logAction={logAction}
                  showAlert={showAlert}
                  showConfirm={showConfirm}
                />
              )}
              {activeTab === 'directory' && (
                <DirectoryView
                  currentUser={currentUser}
                  db={db}
                  saveDirectoryEntry={saveDirectoryEntry}
                  deleteDirectoryEntry={deleteDirectoryEntry}
                  logAction={logAction}
                  showAlert={showAlert}
                  showConfirm={showConfirm}
                />
              )}
              {activeTab === 'legal' && <LegalNoticeView />}
              {activeTab === 'profile' && currentUser.role !== 'guest' && (
                <ProfileView
                  currentUser={currentUser}
                  db={db}
                  updateUserProfile={updateUserProfile}
                  updateUserPlainPassword={updateUserPlainPassword}
                  onProfileSaved={(patch) => setCurrentUser((u) => ({ ...u, ...patch }))}
                  onPasswordChanged={(newPassword) => {
                    savePortalSession(currentUser.username, newPassword)
                    setMustChangePwd(false)
                  }}
                  logAction={logAction}
                  showAlert={showAlert}
                />
              )}
              {activeTab === 'admin' && isAdmin && (
                <AdminUsersView
                  currentUser={currentUser}
                  db={db}
                  approvePendingUser={approvePendingUser}
                  rejectPendingUser={rejectPendingUser}
                  setUserBlockedStatus={setUserBlockedStatus}
                  updateUserProfile={updateUserProfile}
                  logAction={logAction}
                  showAlert={showAlert}
                  showConfirm={showConfirm}
                />
              )}
              {activeTab === 'logs' && isSuperadmin && <LogsView db={db} />}
              {activeTab === 'sections' && isSuperadmin && (
                <SectionVisibilityView
                  db={db}
                  updatePortalSectionSettings={updatePortalSectionSettings}
                  logAction={logAction}
                  showAlert={showAlert}
                />
              )}
            </div>
            <PortalFooter
              onOpenLegal={
                sectionVisibility.legal !== false
                  ? () => {
                      setActiveTab('legal')
                      setIsMenuOpen(false)
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <PortalApp />
    </ErrorBoundary>
  )
}
