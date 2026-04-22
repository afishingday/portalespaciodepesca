import { SITE_BRAND_TITLE } from './utils.js'
import { TENANT } from '../tenant.config.js'

export default function PortalFooter({ onOpenLegal }) {
  const appVersion = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0'
  const appBuild = typeof __APP_BUILD_STAMP__ === 'string' ? __APP_BUILD_STAMP__ : 'build-desconocido'

  return (
    <footer className="text-center text-[11px] sm:text-xs text-zinc-500 space-y-2 py-6 px-4 border-t border-blue-100/50 bg-gradient-to-t from-cyan-50/30 via-white/70 to-blue-50/20 backdrop-blur">
      <p className="text-zinc-600 leading-relaxed">
        Creado por Luis Montoya ·{' '}
        <a href={`tel:${TENANT.defaults.contactPhone}`} className="text-blue-600 font-semibold hover:underline">
          {TENANT.defaults.contactPhone}
        </a>
        {' · '}
        <a
          href="https://www.instagram.com/afishingday/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 font-semibold hover:underline"
        >
          {TENANT.defaults.instagram}
        </a>
      </p>
      {typeof onOpenLegal === 'function' && (
        <p>
          <button
            type="button"
            onClick={onOpenLegal}
            className="text-amber-900/90 font-black hover:text-amber-950 underline decoration-amber-400/80 underline-offset-2"
          >
            Aviso legal del grupo
          </button>
        </p>
      )}
      <p className="text-zinc-400">© 2026 {SITE_BRAND_TITLE}. Todos los derechos reservados.</p>
      <p className="text-[10px] text-zinc-400" aria-label="Versión y fecha de compilación">
        v{appVersion} · {appBuild}
      </p>
    </footer>
  )
}
