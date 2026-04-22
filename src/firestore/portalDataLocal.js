import { INITIAL_DATA, PORTAL_USERS_CONFIG_VERSION } from '../initialData.js'
import {
  PORTAL_DEFAULT_PASSWORD,
  LEGACY_DEFAULT_APPROVED_MEMBER_PASSWORD,
  LEGACY_PASSWORD_MIGRATE_STORAGE_KEY,
} from '../shared/portalAuthConstants.js'
import { FISHING_DIRECTORY_SEED } from '../data/fishingDirectorySeed.js'
import { defaultSectionVisibility, mergeSectionVisibility, mergeSectionOrder } from '../shared/portalSectionConfig.js'
import { COLLECTION_NAMES, stripForFirestore, sortRows } from './portalDataShared.js'

export { COLLECTION_NAMES, stripForFirestore } from './portalDataShared.js'

const STORAGE_KEY = 'ep_portal_local_db_v1'

const subscribers = new Set()

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function buildDemoState() {
  const base = 171_380_000_0000
  const users = clone(INITIAL_DATA.users)
  return {
    users,
    pendingUsers: [
      {
        id: base + 1,
        name: 'María García',
        email: 'maria@ejemplo.com',
        message: 'Me gustaría tener cuenta en el portal y participar en las salidas.',
        date: '19/04/2026',
      },
    ],
    news: [
      {
        id: base + 10,
        title: 'Salida de práctica al embalse',
        excerpt: 'Convocatoria abierta a quienes participan el próximo fin de semana.',
        content:
          'Punto de encuentro: entrada principal. Llevar carné, chaleco y revisar el clima. Cupos limitados según logística.',
        category: 'Salidas',
        image: null,
        author: 'Luis Montoya',
        authorUsername: 'afishingday',
        date: '18/04/2026',
      },
      {
        id: base + 11,
        title: 'Normativa de captura y suelta',
        excerpt: 'Lineamientos para torneos o encuentros informales.',
        content: 'Los detalles se socializarán en la próxima asamblea. Priorizamos el bienestar del pez y el respeto por el entorno.',
        category: 'Normativa',
        image: null,
        author: 'Luis Montoya',
        authorUsername: 'afishingday',
        date: '15/04/2026',
      },
    ],
    proposals: [
      {
        id: base + 20,
        title: 'Torneo express de bass en kayak',
        excerpt: 'Propongo una categoría solo kayak para la próxima fecha.',
        author: 'Carlos Pescador',
        authorUsername: 'dayrolongas',
        date: '12/04/2026',
        status: 'Propuesta',
      },
    ],
    polls: [
      {
        id: base + 30,
        title: 'Próximo destino de salida grupal',
        excerpt: 'Elige la opción que prefieras para agosto.',
        deadline: '2026-08-01T12:00',
        author: 'Luis Montoya',
        authorUsername: 'afishingday',
        date: '10/04/2026',
        survey: {
          question: '¿A dónde vamos en agosto?',
          options: [
            { id: 'opt0', text: 'Embalse Peñol-Guatapé' },
            { id: 'opt1', text: 'Río Magdalena (tramo bajo)' },
            { id: 'opt2', text: 'Ciénaga de Ayapel' },
          ],
          votes: [{ username: 'dayrolongas', optionId: 'opt0', timestamp: '08:30:00' }],
        },
      },
    ],
    events: [
      {
        id: base + 40,
        title: 'Reunión comunitaria',
        date: '2026-05-15T09:00',
        location: 'Lugar por confirmar',
        description: 'Espacio informal para coordinar logística; sin constitución de directiva ni cargos formales.',
      },
      {
        id: base + 41,
        title: 'Salida nocturna Mojarra',
        date: '2026-04-25T19:00',
        location: 'Embalse Calima',
        description: 'Traer frontal y carnada autorizada.',
      },
    ],
    records: [
      {
        id: base + 50,
        species: 'Pavón / Tucunaré',
        weight: '4.2 kg',
        location: 'Río Meta',
        date: '2026-04-02',
        image: null,
        notes: 'Tomado con popper al atardecer.',
        angler: 'Carlos Pescador',
        anglerUsername: 'dayrolongas',
      },
    ],
    laganaWallPosts: [
      {
        id: base + 51,
        species: 'Mojarra Amarilla',
        location: 'Un charquito detrás del rancho',
        date: '2026-04-03',
        image: null,
        angler: 'Luis Montoya',
        anglerUsername: 'afishingday',
        clubVisible: true,
      },
    ],
    talks: [
      {
        id: base + 60,
        title: 'Nudos esenciales en kayak',
        excerpt: 'Palomar, clinch y loop para líderes.',
        content: 'Sesión teórica y práctica en tierra antes de salir al agua.',
        date: '08/04/2026',
        author: 'Luis Montoya',
        authorUsername: 'afishingday',
      },
    ],
    bitacora: [
      {
        id: base + 70,
        username: 'afishingday',
        anglerName: 'Luis Montoya',
        species: 'Mojarra Azul',
        weight: '1.8 kg',
        location: 'Embalse San Francisco',
        date: '2026-04-01',
        bait: 'Twister chartreuse',
        notes: 'Primera captura del mes.',
        image: null,
      },
    ],
    communityPosts: [
      {
        id: base + 82,
        memberName: 'Carlos Pescador',
        serviceType: 'Transporte compartido en camioneta a embalses (fines de semana)',
        phone: '3001234567',
        socialNetworks: '@carlos_pesca',
        author: 'Carlos Pescador',
        authorUsername: 'dayrolongas',
        date: '2026-04-19',
      },
      {
        id: base + 83,
        memberName: 'Luis Montoya',
        serviceType: 'Asesoría en equipos de spinning para quien empieza',
        phone: '3165550101',
        socialNetworks: 'Instagram: @espaciodepesca',
        author: 'Luis Montoya',
        authorUsername: 'afishingday',
        date: '2026-04-17',
      },
    ],
    directoryEntries: clone(FISHING_DIRECTORY_SEED),
    logs: [
      {
        id: base + 80,
        user: 'afishingday',
        action: 'LOGIN',
        details: 'Ingreso al portal (demo local)',
        timestamp: '20/04/2026, 10:00:00 a. m.',
      },
    ],
    settings: { sections: defaultSectionVisibility(), sectionOrder: mergeSectionOrder(null) },
  }
}

function loadPersisted() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

let state = loadPersisted() || buildDemoState()
if (!state.settings?.sections) {
  state = {
    ...clone(state),
    settings: {
      sections: defaultSectionVisibility(),
      sectionOrder: mergeSectionOrder(state.settings?.sectionOrder),
    },
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore quota */
  }
}

if (typeof localStorage !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore quota */
  }
}

function persist() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('[portal local] no se pudo guardar en localStorage:', e)
  }
}

function notify() {
  for (const fn of subscribers) {
    try {
      fn()
    } catch (e) {
      console.error(e)
    }
  }
}

function mutate(updater) {
  const next = clone(state)
  updater(next)
  state = next
  persist()
  notify()
}

function pushFullState(setDb) {
  setDb(() => {
    const out = {}
    for (const name of COLLECTION_NAMES) {
      out[name] = sortRows(name, [...(state[name] || [])])
    }
    out.settings = {
      sections: mergeSectionVisibility(state.settings?.sections),
      sectionOrder: mergeSectionOrder(state.settings?.sectionOrder),
    }
    return out
  })
}

export function subscribePortalDb(setDb, onReady) {
  const tick = () => pushFullState(setDb)
  tick()
  subscribers.add(tick)
  queueMicrotask(() => onReady?.())
  return () => subscribers.delete(tick)
}

export async function seedFirestoreIfEmpty() {
  if (state.users?.length) return
  state = buildDemoState()
  persist()
  notify()
}

export async function seedFishingDirectoryIfEmpty() {
  /* En modo local el directorio demo ya viene en `buildDemoState`. */
}

export async function syncUsersIfNeeded() {
  if (typeof localStorage === 'undefined') return
  if (localStorage.getItem('ep_portal_users_ver') === PORTAL_USERS_CONFIG_VERSION) return

  mutate((draft) => {
    const list = draft.users || []
    const existingIds = new Set(list.map((u) => u.username))
    for (const u of INITIAL_DATA.users) {
      if (existingIds.has(u.username)) {
        const idx = list.findIndex((x) => x.username === u.username)
        if (idx >= 0) {
          const cur = list[idx]
          list[idx] = {
            ...cur,
            role: u.role,
            ...(cur.phone == null || cur.phone === '' ? { phone: u.phone ?? '' } : {}),
          }
        }
      } else {
        list.push(clone(u))
      }
    }
    draft.users = list
  })
  localStorage.setItem('ep_portal_users_ver', PORTAL_USERS_CONFIG_VERSION)
}

/** Una sola vez por navegador: usuarios con clave inicial antigua pasan a la clave inicial actual. */
export async function migrateLegacyApprovedPasswordIfNeeded() {
  if (typeof localStorage === 'undefined') return
  if (localStorage.getItem(LEGACY_PASSWORD_MIGRATE_STORAGE_KEY) === '1') return

  mutate((draft) => {
    const users = draft.users || []
    for (let i = 0; i < users.length; i++) {
      if (users[i].password !== LEGACY_DEFAULT_APPROVED_MEMBER_PASSWORD) continue
      users[i] = { ...users[i], password: PORTAL_DEFAULT_PASSWORD }
    }
  })
  localStorage.setItem(LEGACY_PASSWORD_MIGRATE_STORAGE_KEY, '1')
}

export async function updateUserPlainPassword(username, currentPassword, newPassword) {
  const user = state.users?.find((u) => u.username === username)
  if (!user) throw new Error('USER_NOT_FOUND')
  if (user.password !== currentPassword) throw new Error('WRONG_PASSWORD')
  const next = String(newPassword ?? '').trim()
  if (!next) throw new Error('INVALID_NEW_PASSWORD')
  mutate((draft) => {
    const idx = draft.users.findIndex((u) => u.username === username)
    if (idx >= 0) draft.users[idx] = { ...draft.users[idx], password: next }
  })
}

export async function updateUserProfile(username, partial) {
  mutate((draft) => {
    const idx = draft.users.findIndex((u) => u.username === username)
    if (idx >= 0) {
      draft.users[idx] = {
        ...draft.users[idx],
        username,
        ...stripForFirestore(partial),
        profileUpdatedAt: Date.now(),
      }
    }
  })
}

export async function setUserBlockedStatus(username, blocked) {
  mutate((draft) => {
    const idx = draft.users.findIndex((u) => u.username === username)
    if (idx >= 0) draft.users[idx] = { ...draft.users[idx], blocked: Boolean(blocked) }
  })
}

export async function approvePendingUser(pendingId, newUser) {
  mutate((draft) => {
    draft.users.push(stripForFirestore(newUser))
    draft.pendingUsers = (draft.pendingUsers || []).filter((p) => String(p.id) !== String(pendingId))
  })
}

export async function rejectPendingUser(pendingId) {
  mutate((draft) => {
    draft.pendingUsers = (draft.pendingUsers || []).filter((p) => String(p.id) !== String(pendingId))
  })
}

export async function addPendingUser(pending) {
  mutate((draft) => {
    draft.pendingUsers = [...(draft.pendingUsers || []), stripForFirestore(pending)]
  })
}

export async function appendLog(entry) {
  const id = Date.now()
  mutate((draft) => {
    draft.logs = [...(draft.logs || []), stripForFirestore({ ...entry, id })]
  })
}

export async function addNewsPost(post) {
  mutate((draft) => {
    const rows = draft.news || []
    const next = stripForFirestore(post)
    draft.news = [...rows.filter((r) => String(r.id) !== String(post.id)), next]
  })
}

export async function updateNewsPost(post) {
  await addNewsPost(post)
}

export async function deleteNewsPost(id) {
  mutate((draft) => {
    draft.news = (draft.news || []).filter((r) => String(r.id) !== String(id))
  })
}

export async function saveProposal(proposal) {
  mutate((draft) => {
    const rows = draft.proposals || []
    const next = stripForFirestore(proposal)
    draft.proposals = [...rows.filter((r) => String(r.id) !== String(proposal.id)), next]
  })
}

export async function deleteProposal(id) {
  mutate((draft) => {
    draft.proposals = (draft.proposals || []).filter((r) => String(r.id) !== String(id))
  })
}

export async function convertProposalToPoll(proposalId, newPoll) {
  mutate((draft) => {
    draft.polls = [...(draft.polls || []), stripForFirestore(newPoll)]
    draft.proposals = (draft.proposals || []).filter((r) => String(r.id) !== String(proposalId))
  })
}

export async function convertProposalToEvent(proposalId, newEvent) {
  mutate((draft) => {
    draft.events = [...(draft.events || []), stripForFirestore(newEvent)]
    draft.proposals = (draft.proposals || []).filter((r) => String(r.id) !== String(proposalId))
  })
}

export async function savePoll(poll) {
  mutate((draft) => {
    const rows = draft.polls || []
    const next = stripForFirestore(poll)
    draft.polls = [...rows.filter((r) => String(r.id) !== String(poll.id)), next]
  })
}

export async function deletePoll(id) {
  mutate((draft) => {
    draft.polls = (draft.polls || []).filter((r) => String(r.id) !== String(id))
  })
}

export async function saveEvent(event) {
  mutate((draft) => {
    const rows = draft.events || []
    const next = stripForFirestore(event)
    draft.events = [...rows.filter((r) => String(r.id) !== String(event.id)), next]
  })
}

export async function deleteEvent(id) {
  mutate((draft) => {
    draft.events = (draft.events || []).filter((r) => String(r.id) !== String(id))
  })
}

export async function saveRecord(record) {
  mutate((draft) => {
    const rows = draft.records || []
    const next = stripForFirestore(record)
    draft.records = [...rows.filter((r) => String(r.id) !== String(record.id)), next]
  })
}

export async function deleteRecord(id) {
  mutate((draft) => {
    draft.records = (draft.records || []).filter((r) => String(r.id) !== String(id))
  })
}

export async function saveLaganaWallPost(post) {
  mutate((draft) => {
    const rows = draft.laganaWallPosts || []
    const next = stripForFirestore(post)
    draft.laganaWallPosts = [...rows.filter((r) => String(r.id) !== String(post.id)), next]
  })
}

export async function deleteLaganaWallPost(id) {
  mutate((draft) => {
    draft.laganaWallPosts = (draft.laganaWallPosts || []).filter((r) => String(r.id) !== String(id))
  })
}

export async function saveTalk(talk) {
  mutate((draft) => {
    const rows = draft.talks || []
    const next = stripForFirestore(talk)
    draft.talks = [...rows.filter((r) => String(r.id) !== String(talk.id)), next]
  })
}

export async function deleteTalk(id) {
  mutate((draft) => {
    draft.talks = (draft.talks || []).filter((r) => String(r.id) !== String(id))
  })
}

export async function saveBitacoraEntry(entry) {
  mutate((draft) => {
    const rows = draft.bitacora || []
    const next = stripForFirestore(entry)
    draft.bitacora = [...rows.filter((r) => String(r.id) !== String(entry.id)), next]
  })
}

export async function deleteBitacoraEntry(id) {
  mutate((draft) => {
    draft.bitacora = (draft.bitacora || []).filter((r) => String(r.id) !== String(id))
  })
}

export async function saveCommunityPost(post) {
  mutate((draft) => {
    const rows = draft.communityPosts || []
    const next = stripForFirestore(post)
    draft.communityPosts = [...rows.filter((r) => String(r.id) !== String(post.id)), next]
  })
}

export async function deleteCommunityPost(id) {
  mutate((draft) => {
    draft.communityPosts = (draft.communityPosts || []).filter((r) => String(r.id) !== String(id))
  })
}

export async function saveDirectoryEntry(entry) {
  mutate((draft) => {
    const rows = draft.directoryEntries || []
    const next = stripForFirestore(entry)
    draft.directoryEntries = [...rows.filter((r) => String(r.id) !== String(entry.id)), next]
  })
}

export async function deleteDirectoryEntry(id) {
  mutate((draft) => {
    draft.directoryEntries = (draft.directoryEntries || []).filter((r) => String(r.id) !== String(id))
  })
}

export async function updatePortalSectionSettings({ sections, sectionOrder } = {}) {
  mutate((draft) => {
    const cur = draft.settings && typeof draft.settings === 'object' ? draft.settings : {}
    const nextSections =
      sections != null && typeof sections === 'object'
        ? mergeSectionVisibility(sections)
        : mergeSectionVisibility(cur.sections)
    const nextOrder =
      sectionOrder != null ? mergeSectionOrder(sectionOrder) : mergeSectionOrder(cur.sectionOrder)
    draft.settings = { ...cur, sections: nextSections, sectionOrder: nextOrder }
  })
}

export async function updatePortalSectionVisibility(sections) {
  await updatePortalSectionSettings({ sections })
}
