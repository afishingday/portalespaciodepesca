import { getAvatarById } from './utils.js'

/**
 * Avatar del usuario en barra lateral / cabecera: imagen desde `assets/icons` o inicial del nombre.
 */
export default function PortalUserAvatar({
  user,
  sizeClass = 'w-10 h-10',
  textClass = 'text-sm',
  roundedClass = 'rounded-full',
}) {
  const meta = getAvatarById(user?.avatar)
  const initial = (user?.name || user?.username || '?').charAt(0).toUpperCase()
  if (meta?.src) {
    return (
      <div
        className={`${sizeClass} ${roundedClass} overflow-hidden shrink-0 ring-1 ring-white/40 bg-white shadow-sm`}
      >
        <img src={meta.src} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
      </div>
    )
  }
  return (
    <div
      className={`${sizeClass} ${roundedClass} bg-gradient-to-br from-blue-900 to-green-700 flex items-center justify-center font-black text-white shrink-0 shadow-sm ${textClass}`}
    >
      {initial}
    </div>
  )
}
