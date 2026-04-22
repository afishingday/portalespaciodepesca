/** YouTube video ids are 11 characters (letters, digits, underscore, hyphen). */
export const YOUTUBE_VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/

/**
 * Returns a canonical 11-char video id, or null if the string is empty or not a recognized YouTube link/id.
 * Accepts raw ids, watch URLs, youtu.be, embed, shorts, live.
 */
export function extractYoutubeVideoId(raw) {
  let s = String(raw ?? '').trim()
  if (!s) return null
  if (YOUTUBE_VIDEO_ID_RE.test(s)) return s
  if (!/^https?:\/\//i.test(s) && /youtube\.com|youtu\.be/i.test(s)) s = `https://${s}`

  let u
  try {
    u = new URL(s)
  } catch {
    return null
  }

  const host = u.hostname.replace(/^www\./i, '').toLowerCase()

  if (host === 'youtu.be') {
    const id = u.pathname.split('/').filter(Boolean)[0]?.split('?')[0] ?? ''
    return YOUTUBE_VIDEO_ID_RE.test(id) ? id : null
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    const v = u.searchParams.get('v')
    if (v && YOUTUBE_VIDEO_ID_RE.test(v)) return v
    const parts = u.pathname.split('/').filter(Boolean)
    const pick = (segment) => {
      const i = parts.indexOf(segment)
      const id = i >= 0 ? parts[i + 1] : ''
      return id && YOUTUBE_VIDEO_ID_RE.test(id) ? id : null
    }
    return pick('embed') || pick('shorts') || pick('live') || null
  }

  if (host === 'youtube-nocookie.com') {
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts[0] === 'embed' && parts[1] && YOUTUBE_VIDEO_ID_RE.test(parts[1])) return parts[1]
  }

  return null
}

export function youtubeWatchUrl(videoId) {
  if (!videoId || !YOUTUBE_VIDEO_ID_RE.test(videoId)) return ''
  return `https://www.youtube.com/watch?v=${videoId}`
}
