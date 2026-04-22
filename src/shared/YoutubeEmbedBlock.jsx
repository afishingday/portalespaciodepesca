import { YOUTUBE_VIDEO_ID_RE } from './youtube.js'

/** Responsive YouTube iframe; `videoId` must already be validated. */
export function YoutubeEmbedBlock({ videoId, title = 'Video de YouTube' }) {
  if (!videoId || !YOUTUBE_VIDEO_ID_RE.test(videoId)) return null
  return (
    <div className="my-6 w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 shadow-sm">
      <div className="relative aspect-video w-full">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  )
}
