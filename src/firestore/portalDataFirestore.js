import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { INITIAL_DATA, PORTAL_USERS_CONFIG_VERSION } from '../initialData.js'
import {
  PORTAL_DEFAULT_PASSWORD,
  LEGACY_DEFAULT_APPROVED_MEMBER_PASSWORD,
  LEGACY_PASSWORD_MIGRATE_STORAGE_KEY,
} from '../shared/portalAuthConstants.js'
import { FISHING_DIRECTORY_SEED } from '../data/fishingDirectorySeed.js'
import { mergeSectionVisibility, mergeSectionOrder } from '../shared/portalSectionConfig.js'
import { COLLECTION_NAMES, stripForFirestore, sortRows } from './portalDataShared.js'

export { COLLECTION_NAMES, stripForFirestore } from './portalDataShared.js'

function docToRow(d) {
  const data = d.data()
  let { id } = data
  if (id === undefined) {
    const n = Number(d.id)
    id = Number.isNaN(n) ? d.id : n
  }
  return { ...data, id }
}

/** Doc ID en Firestore suele ser el username; si el doc se creó con otro ID, localizar por campo `username`. */
async function resolveUserDocument(username) {
  const u = String(username ?? '').trim()
  if (!u) return null
  const directRef = doc(db, 'users', u)
  const directSnap = await getDoc(directRef)
  if (directSnap.exists()) return { ref: directRef, data: directSnap.data() }

  const q = query(collection(db, 'users'), where('username', '==', u), limit(1))
  const qs = await getDocs(q)
  if (qs.empty) return null
  const d = qs.docs[0]
  return { ref: d.ref, data: d.data() }
}

const SETTINGS_DOC_ID = 'portal'

export function subscribePortalDb(setDb, onReady) {
  const gotFirst = new Set()
  const mark = (name) => {
    gotFirst.add(name)
    if (gotFirst.size === COLLECTION_NAMES.length + 1) onReady?.()
  }

  const unsubs = COLLECTION_NAMES.map((name) =>
    onSnapshot(
      collection(db, name),
      (snap) => {
        const rows = sortRows(name, snap.docs.map(docToRow))
        setDb((prev) => ({ ...prev, [name]: rows }))
        mark(name)
      },
      (err) => {
        console.error(`Firestore [${name}]:`, err)
        mark(name)
      },
    ),
  )

  const unsubSettings = onSnapshot(
    doc(db, 'settings', SETTINGS_DOC_ID),
    (snap) => {
      const data = snap.exists() ? snap.data() : {}
      const sections = mergeSectionVisibility(data.sections)
      const sectionOrder = mergeSectionOrder(data.sectionOrder)
      setDb((prev) => ({
        ...prev,
        settings: { ...(prev.settings && typeof prev.settings === 'object' ? prev.settings : {}), sections, sectionOrder },
      }))
      mark('__settings__')
    },
    (err) => {
      console.error('Firestore [settings/portal]:', err)
      mark('__settings__')
    },
  )

  return () => {
    unsubs.forEach((u) => u())
    unsubSettings()
  }
}

export async function seedFirestoreIfEmpty() {
  const snap = await getDocs(collection(db, 'users'))
  if (!snap.empty) return

  const batch = writeBatch(db)
  INITIAL_DATA.users.forEach((u) => {
    batch.set(doc(db, 'users', u.username), stripForFirestore(u))
  })
  await batch.commit()
}

/** Si la colección está vacía, carga el directorio curado del club (una sola vez por proyecto). */
export async function seedFishingDirectoryIfEmpty() {
  const dir = await getDocs(collection(db, 'directoryEntries'))
  if (!dir.empty) return
  const batch = writeBatch(db)
  FISHING_DIRECTORY_SEED.forEach((row) => {
    batch.set(doc(db, 'directoryEntries', String(row.id)), stripForFirestore(row))
  })
  await batch.commit()
}

export async function syncUsersIfNeeded() {
  if (typeof localStorage === 'undefined') return
  if (localStorage.getItem('ep_portal_users_ver') === PORTAL_USERS_CONFIG_VERSION) return

  const snap = await getDocs(collection(db, 'users'))
  const existingIds = new Set(snap.docs.map((d) => d.id))

  const batch = writeBatch(db)
  INITIAL_DATA.users.forEach((u) => {
    if (existingIds.has(u.username)) {
      batch.set(doc(db, 'users', u.username), stripForFirestore({ username: u.username, role: u.role }), { merge: true })
    } else {
      batch.set(doc(db, 'users', u.username), stripForFirestore(u))
    }
  })
  await batch.commit()
  localStorage.setItem('ep_portal_users_ver', PORTAL_USERS_CONFIG_VERSION)
}

/** Una sola vez por navegador: usuarios con clave inicial antigua pasan a la clave inicial actual. */
export async function migrateLegacyApprovedPasswordIfNeeded() {
  if (typeof localStorage === 'undefined') return
  if (localStorage.getItem(LEGACY_PASSWORD_MIGRATE_STORAGE_KEY) === '1') return

  const snap = await getDocs(collection(db, 'users'))
  let batch = writeBatch(db)
  let n = 0
  const flush = async () => {
    if (n === 0) return
    await batch.commit()
    batch = writeBatch(db)
    n = 0
  }
  for (const d of snap.docs) {
    const pwd = d.data()?.password
    if (pwd !== LEGACY_DEFAULT_APPROVED_MEMBER_PASSWORD) continue
    batch.update(d.ref, { password: PORTAL_DEFAULT_PASSWORD })
    n++
    if (n >= 450) await flush()
  }
  await flush()
  localStorage.setItem(LEGACY_PASSWORD_MIGRATE_STORAGE_KEY, '1')
}

export async function updateUserPlainPassword(username, currentPassword, newPassword) {
  const found = await resolveUserDocument(username)
  if (!found) throw new Error('USER_NOT_FOUND')
  const { ref, data } = found
  if (data.password !== currentPassword) throw new Error('WRONG_PASSWORD')
  const next = String(newPassword ?? '').trim()
  if (!next) throw new Error('INVALID_NEW_PASSWORD')
  await updateDoc(ref, { password: next })
}

export async function updateUserProfile(username, partial) {
  const u = String(username ?? '').trim()
  const found = await resolveUserDocument(u)
  const ref = found?.ref ?? doc(db, 'users', u)
  await setDoc(ref, stripForFirestore({ username: u, ...partial, profileUpdatedAt: Date.now() }), { merge: true })
}

export async function setUserBlockedStatus(username, blocked) {
  const found = await resolveUserDocument(username)
  if (!found) throw new Error('USER_NOT_FOUND')
  await updateDoc(found.ref, { blocked: Boolean(blocked) })
}

export async function approvePendingUser(pendingId, newUser) {
  const batch = writeBatch(db)
  batch.set(doc(db, 'users', newUser.username), stripForFirestore(newUser))
  batch.delete(doc(db, 'pendingUsers', String(pendingId)))
  await batch.commit()
}

export async function rejectPendingUser(pendingId) {
  await deleteDoc(doc(db, 'pendingUsers', String(pendingId)))
}

export async function addPendingUser(pending) {
  await setDoc(doc(db, 'pendingUsers', String(pending.id)), stripForFirestore(pending))
}

export async function appendLog(entry) {
  const id = Date.now()
  await setDoc(doc(db, 'logs', String(id)), stripForFirestore({ ...entry, id }))
}

export async function addNewsPost(post) {
  await setDoc(doc(db, 'news', String(post.id)), stripForFirestore(post))
}
export async function updateNewsPost(post) {
  await setDoc(doc(db, 'news', String(post.id)), stripForFirestore(post))
}
export async function deleteNewsPost(id) {
  await deleteDoc(doc(db, 'news', String(id)))
}

export async function saveProposal(proposal) {
  await setDoc(doc(db, 'proposals', String(proposal.id)), stripForFirestore(proposal))
}
export async function deleteProposal(id) {
  await deleteDoc(doc(db, 'proposals', String(id)))
}
export async function convertProposalToPoll(proposalId, newPoll) {
  const batch = writeBatch(db)
  batch.set(doc(db, 'polls', String(newPoll.id)), stripForFirestore(newPoll))
  batch.delete(doc(db, 'proposals', String(proposalId)))
  await batch.commit()
}
export async function convertProposalToEvent(proposalId, newEvent) {
  const batch = writeBatch(db)
  batch.set(doc(db, 'events', String(newEvent.id)), stripForFirestore(newEvent))
  batch.delete(doc(db, 'proposals', String(proposalId)))
  await batch.commit()
}

export async function savePoll(poll) {
  await setDoc(doc(db, 'polls', String(poll.id)), stripForFirestore(poll))
}
export async function deletePoll(id) {
  await deleteDoc(doc(db, 'polls', String(id)))
}

export async function saveEvent(event) {
  await setDoc(doc(db, 'events', String(event.id)), stripForFirestore(event))
}
export async function deleteEvent(id) {
  await deleteDoc(doc(db, 'events', String(id)))
}

export async function saveRecord(record) {
  await setDoc(doc(db, 'records', String(record.id)), stripForFirestore(record))
}
export async function deleteRecord(id) {
  await deleteDoc(doc(db, 'records', String(id)))
}

export async function saveLaganaWallPost(post) {
  await setDoc(doc(db, 'laganaWallPosts', String(post.id)), stripForFirestore(post))
}
export async function deleteLaganaWallPost(id) {
  await deleteDoc(doc(db, 'laganaWallPosts', String(id)))
}

export async function saveTalk(talk) {
  await setDoc(doc(db, 'talks', String(talk.id)), stripForFirestore(talk))
}
export async function deleteTalk(id) {
  await deleteDoc(doc(db, 'talks', String(id)))
}

export async function saveBitacoraEntry(entry) {
  await setDoc(doc(db, 'bitacora', String(entry.id)), stripForFirestore(entry))
}
export async function deleteBitacoraEntry(id) {
  await deleteDoc(doc(db, 'bitacora', String(id)))
}

export async function saveCommunityPost(post) {
  await setDoc(doc(db, 'communityPosts', String(post.id)), stripForFirestore(post))
}
export async function deleteCommunityPost(id) {
  await deleteDoc(doc(db, 'communityPosts', String(id)))
}

export async function saveDirectoryEntry(entry) {
  await setDoc(doc(db, 'directoryEntries', String(entry.id)), stripForFirestore(entry))
}
export async function deleteDirectoryEntry(id) {
  await deleteDoc(doc(db, 'directoryEntries', String(id)))
}

export async function updatePortalSectionSettings({ sections, sectionOrder } = {}) {
  const patch = {}
  if (sections != null && typeof sections === 'object') {
    patch.sections = mergeSectionVisibility(sections)
  }
  if (sectionOrder != null) {
    patch.sectionOrder = mergeSectionOrder(sectionOrder)
  }
  if (Object.keys(patch).length === 0) return
  await setDoc(doc(db, 'settings', SETTINGS_DOC_ID), stripForFirestore(patch), { merge: true })
}

export async function updatePortalSectionVisibility(sections) {
  await updatePortalSectionSettings({ sections })
}
