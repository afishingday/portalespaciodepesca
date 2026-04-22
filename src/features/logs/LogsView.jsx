import { useState, useMemo } from 'react'
import {
  ScrollText,
  LogIn,
  KeyRound,
  ShieldAlert,
  Filter,
  Newspaper,
  Megaphone,
  CheckSquare,
  CalendarDays,
  Trophy,
  Droplets,
  Video,
  BookOpen,
  UserCheck,
  UserX,
  Layers,
  MessageCircle,
  MapPinned,
  Handshake,
  UserCircle,
} from 'lucide-react'

const ACTION_META = {
  LOGIN: { label: 'Ingreso', icon: LogIn, colors: 'bg-blue-100 text-blue-800 border-blue-200' },
  LOGIN_VISITANTE: { label: 'Ingreso visitante', icon: LogIn, colors: 'bg-sky-100 text-sky-800 border-sky-200' },
  NUEVA_NOTICIA: { label: 'Nueva noticia', icon: Newspaper, colors: 'bg-sky-100 text-sky-800 border-sky-200' },
  EDITAR_NOTICIA: { label: 'Editar noticia', icon: Newspaper, colors: 'bg-sky-100 text-sky-800 border-sky-200' },
  ELIMINAR_NOTICIA: { label: 'Eliminar noticia', icon: Newspaper, colors: 'bg-red-100 text-red-800 border-red-200' },
  NUEVA_PROPUESTA: { label: 'Nueva propuesta', icon: Megaphone, colors: 'bg-violet-100 text-violet-800 border-violet-200' },
  EDITAR_PROPUESTA: { label: 'Editar propuesta', icon: Megaphone, colors: 'bg-violet-100 text-violet-800 border-violet-200' },
  ELIMINAR_PROPUESTA: { label: 'Eliminar propuesta', icon: Megaphone, colors: 'bg-red-100 text-red-800 border-red-200' },
  NUEVA_ENCUESTA: { label: 'Nueva encuesta', icon: CheckSquare, colors: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  NUEVA_VOTACION: { label: 'Nueva votación', icon: CheckSquare, colors: 'bg-indigo-100 text-indigo-900 border-indigo-200' },
  EDITAR_VOTACION: { label: 'Editar votación', icon: CheckSquare, colors: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  ELIMINAR_VOTACION: { label: 'Eliminar votación', icon: CheckSquare, colors: 'bg-red-100 text-red-800 border-red-200' },
  VOTAR: { label: 'Votó en encuesta', icon: CheckSquare, colors: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  VOTAR_ENCUESTA: { label: 'Votó en encuesta', icon: CheckSquare, colors: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  NUEVO_EVENTO: { label: 'Nuevo evento', icon: CalendarDays, colors: 'bg-teal-100 text-teal-800 border-teal-200' },
  EDITAR_EVENTO: { label: 'Editar evento', icon: CalendarDays, colors: 'bg-teal-100 text-teal-800 border-teal-200' },
  ELIMINAR_EVENTO: { label: 'Eliminar evento', icon: CalendarDays, colors: 'bg-red-100 text-red-800 border-red-200' },
  NUEVO_RECORD: { label: 'Nuevo récord', icon: Trophy, colors: 'bg-amber-100 text-amber-800 border-amber-200' },
  EDITAR_RECORD: { label: 'Editar récord', icon: Trophy, colors: 'bg-amber-100 text-amber-800 border-amber-200' },
  ELIMINAR_RECORD: { label: 'Eliminar récord', icon: Trophy, colors: 'bg-red-100 text-red-800 border-red-200' },
  RECORD_VISIBLE_CLUB: { label: 'Récord visible en muro', icon: Trophy, colors: 'bg-amber-100 text-amber-900 border-amber-200' },
  RECORD_OCULTO_CLUB: { label: 'Récord oculto del muro', icon: Trophy, colors: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  RECORD_MODERACION_OCULTAR: { label: 'Moderación: retirar récord', icon: ShieldAlert, colors: 'bg-rose-100 text-rose-900 border-rose-200' },
  RECORD_MODERACION_RESTAURAR: { label: 'Moderación: restaurar récord', icon: ShieldAlert, colors: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  NUEVO_MURO_LAGANA: { label: 'Muro Lagañas: nueva', icon: Droplets, colors: 'bg-sky-100 text-sky-900 border-sky-200' },
  EDITAR_MURO_LAGANA: { label: 'Muro Lagañas: editar', icon: Droplets, colors: 'bg-sky-100 text-sky-800 border-sky-200' },
  ELIMINAR_MURO_LAGANA: { label: 'Muro Lagañas: eliminar', icon: Droplets, colors: 'bg-red-100 text-red-800 border-red-200' },
  LAGANA_VISIBLE_CLUB: { label: 'Lagaña visible en muro', icon: Droplets, colors: 'bg-sky-100 text-sky-900 border-sky-200' },
  LAGANA_OCULTO_CLUB: { label: 'Lagaña oculta del muro', icon: Droplets, colors: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  LAGANA_MODERACION_OCULTAR: { label: 'Moderación: retirar lagaña', icon: ShieldAlert, colors: 'bg-rose-100 text-rose-900 border-rose-200' },
  LAGANA_MODERACION_RESTAURAR: { label: 'Moderación: restaurar lagaña', icon: ShieldAlert, colors: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  NUEVA_CHARLA: { label: 'Nueva charla', icon: Video, colors: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  EDITAR_CHARLA: { label: 'Editar charla', icon: Video, colors: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  ELIMINAR_CHARLA: { label: 'Eliminar charla', icon: Video, colors: 'bg-red-100 text-red-800 border-red-200' },
  NUEVA_BITACORA: { label: 'Bitácora', icon: BookOpen, colors: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  EDITAR_BITACORA: { label: 'Editar bitácora', icon: BookOpen, colors: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  ELIMINAR_BITACORA: { label: 'Eliminar bitácora', icon: BookOpen, colors: 'bg-red-100 text-red-800 border-red-200' },
  NUEVO_POST_COMUNIDAD: { label: 'Comunidad (hist.): nuevo', icon: MessageCircle, colors: 'bg-sky-100 text-sky-900 border-sky-200' },
  ELIMINAR_POST_COMUNIDAD: { label: 'Comunidad (hist.): eliminar', icon: MessageCircle, colors: 'bg-red-100 text-red-800 border-red-200' },
  NUEVO_SERVICIO_SOCIO: { label: 'Servicio (registrados): nuevo', icon: Handshake, colors: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  EDITAR_SERVICIO_SOCIO: { label: 'Servicio (registrados): editar', icon: Handshake, colors: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  ELIMINAR_SERVICIO_SOCIO: { label: 'Servicio (registrados): eliminar', icon: Handshake, colors: 'bg-red-100 text-red-800 border-red-200' },
  ACTUALIZAR_PERFIL: { label: 'Perfil actualizado', icon: UserCircle, colors: 'bg-slate-100 text-slate-900 border-slate-200' },
  NUEVO_DIRECTORIO_PESCA: { label: 'Directorio: nueva ficha', icon: MapPinned, colors: 'bg-teal-100 text-teal-900 border-teal-200' },
  EDITAR_DIRECTORIO_PESCA: { label: 'Directorio: editar', icon: MapPinned, colors: 'bg-teal-100 text-teal-800 border-teal-200' },
  ELIMINAR_DIRECTORIO_PESCA: { label: 'Directorio: eliminar', icon: MapPinned, colors: 'bg-red-100 text-red-800 border-red-200' },
  APROBAR_SOCIO: { label: 'Cuenta aprobada', icon: UserCheck, colors: 'bg-green-100 text-green-800 border-green-200' },
  RECHAZAR_SOCIO: { label: 'Solicitud rechazada', icon: UserX, colors: 'bg-red-100 text-red-800 border-red-200' },
  CAMBIAR_CONTRASENA: { label: 'Cambio de clave', icon: KeyRound, colors: 'bg-amber-100 text-amber-800 border-amber-200' },
  SUPERADMIN_RESET_CLAVE: { label: 'Reset de clave', icon: ShieldAlert, colors: 'bg-rose-100 text-rose-800 border-rose-200' },
  SUPERADMIN_BLOQUEO_USUARIO: { label: 'Bloqueo', icon: ShieldAlert, colors: 'bg-rose-100 text-rose-800 border-rose-200' },
  SUPERADMIN_DESBLOQUEO_USUARIO: { label: 'Desbloqueo', icon: ShieldAlert, colors: 'bg-blue-100 text-blue-800 border-blue-200' },
  PORTAL_SECCION_VISIBILIDAD: { label: 'Visibilidad de sección', icon: Layers, colors: 'bg-violet-100 text-violet-900 border-violet-200' },
  PORTAL_SECCION_ORDEN: { label: 'Orden de secciones', icon: Layers, colors: 'bg-indigo-100 text-indigo-900 border-indigo-200' },
}

const DEFAULT_META = { label: 'Acción', icon: ScrollText, colors: 'bg-zinc-100 text-zinc-700 border-zinc-200' }

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'LOGIN', label: 'Ingresos', actions: ['LOGIN', 'LOGIN_VISITANTE'] },
  {
    id: 'content',
    label: 'Contenido',
    actions: [
      'NUEVA_NOTICIA',
      'EDITAR_NOTICIA',
      'ELIMINAR_NOTICIA',
      'NUEVA_PROPUESTA',
      'EDITAR_PROPUESTA',
      'NUEVA_ENCUESTA',
      'NUEVA_VOTACION',
      'EDITAR_VOTACION',
      'ELIMINAR_VOTACION',
      'VOTAR',
      'VOTAR_ENCUESTA',
      'NUEVO_EVENTO',
      'NUEVO_RECORD',
      'EDITAR_MURO_LAGANA',
      'NUEVO_MURO_LAGANA',
      'ELIMINAR_MURO_LAGANA',
      'NUEVA_CHARLA',
      'NUEVA_BITACORA',
      'NUEVO_POST_COMUNIDAD',
      'ELIMINAR_POST_COMUNIDAD',
      'NUEVO_SERVICIO_SOCIO',
      'EDITAR_SERVICIO_SOCIO',
      'ELIMINAR_SERVICIO_SOCIO',
      'ACTUALIZAR_PERFIL',
      'NUEVO_DIRECTORIO_PESCA',
      'EDITAR_DIRECTORIO_PESCA',
      'ELIMINAR_DIRECTORIO_PESCA',
    ],
  },
  { id: 'admin', label: 'Admin', actions: ['APROBAR_SOCIO', 'RECHAZAR_SOCIO', 'SUPERADMIN_RESET_CLAVE', 'SUPERADMIN_BLOQUEO_USUARIO', 'SUPERADMIN_DESBLOQUEO_USUARIO', 'CAMBIAR_CONTRASENA', 'PORTAL_SECCION_VISIBILIDAD', 'PORTAL_SECCION_ORDEN', 'RECORD_MODERACION_OCULTAR', 'RECORD_MODERACION_RESTAURAR', 'RECORD_VISIBLE_CLUB', 'RECORD_OCULTO_CLUB', 'LAGANA_MODERACION_OCULTAR', 'LAGANA_MODERACION_RESTAURAR', 'LAGANA_VISIBLE_CLUB', 'LAGANA_OCULTO_CLUB'] },
]

const MAX_ENTRIES = 200

export default function LogsView({ db }) {
  const [activeFilter, setActiveFilter] = useState('all')

  const sortedLogs = useMemo(() => {
    const logs = Array.isArray(db.logs) ? db.logs : []
    return [...logs].sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0)).slice(0, MAX_ENTRIES)
  }, [db.logs])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return sortedLogs
    const filterDef = FILTERS.find((f) => f.id === activeFilter)
    if (!filterDef) return sortedLogs
    const actions = filterDef.actions ?? [filterDef.id]
    return sortedLogs.filter((e) => actions.includes(e.action))
  }, [sortedLogs, activeFilter])

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
            <ScrollText className="w-7 h-7 text-rose-600" /> Registro de actividad
          </h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Últimos {MAX_ENTRIES} eventos · Visible para administradores (ingresos, cambios de clave y acciones del portal)
          </p>
        </div>
        <span className="text-xs font-bold text-zinc-500 bg-zinc-100 border border-zinc-200 rounded-xl px-3 py-1.5 self-start sm:self-auto">
          {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${activeFilter === f.id ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-zinc-700 border-zinc-200 hover:border-rose-300 hover:text-rose-700'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-zinc-200 bg-white/70 p-12 text-center">
          <ScrollText className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 font-bold">No hay registros para este filtro.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-zinc-200 bg-white/70 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/80">
                  <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-zinc-500">Fecha y hora</th>
                  <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-zinc-500">Usuario</th>
                  <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-zinc-500">Evento</th>
                  <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-zinc-500 hidden md:table-cell">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((entry) => {
                  const meta = ACTION_META[entry.action] ?? DEFAULT_META
                  const Icon = meta.icon
                  return (
                    <tr key={entry.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-5 py-3.5 text-xs font-medium text-zinc-600 whitespace-nowrap">{entry.timestamp ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-black text-zinc-900 bg-zinc-100 rounded-lg px-2 py-1">{entry.user ?? '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold ${meta.colors}`}>
                          <Icon className="w-3 h-3 shrink-0" />{meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-500 hidden md:table-cell max-w-xs truncate">{entry.details ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {sortedLogs.length === MAX_ENTRIES && (
            <p className="px-5 py-3 text-center text-xs text-zinc-400 border-t border-zinc-100 bg-zinc-50/60">
              Mostrando los {MAX_ENTRIES} registros más recientes.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
