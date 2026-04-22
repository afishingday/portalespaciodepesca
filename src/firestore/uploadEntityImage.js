import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '../firebase.js'
import { compressImageFileIfNeeded } from '../shared/compressImageUnderMaxBytes.js'

/** Máximo del archivo en Storage (debe coincidir con storage.rules). */
export const MAX_ENTITY_IMAGE_BYTES = 600 * 1024

/** Tamaño máximo del archivo en el dispositivo antes de comprimir (evita cargas enormes en memoria). */
export const MAX_ENTITY_IMAGE_SOURCE_BYTES = 15 * 1024 * 1024

export async function uploadEntityImageFile(file, folder, entityId) {
  if (!(file instanceof File) || file.size === 0) throw new Error('ENTITY_IMAGE_INVALID')
  if (!storage) throw new Error('ENTITY_IMAGE_STORAGE_UNAVAILABLE')

  let prepared = file
  try {
    prepared = await compressImageFileIfNeeded(file, MAX_ENTITY_IMAGE_BYTES)
  } catch (e) {
    if (e instanceof Error && String(e.message).startsWith('ENTITY_IMAGE_')) throw e
    throw new Error('ENTITY_IMAGE_DECODE_FAILED')
  }
  if (prepared.size > MAX_ENTITY_IMAGE_BYTES) throw new Error('ENTITY_IMAGE_TOO_LARGE')

  const safeName = prepared.name.replace(/[^\w.\-]/g, '_').slice(0, 96) || 'photo.jpg'
  const path = `${folder}/${entityId}/${Date.now()}_${safeName}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, prepared, {
    contentType: prepared.type || 'image/jpeg',
  })
  return getDownloadURL(storageRef)
}
