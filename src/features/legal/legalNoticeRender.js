import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { TENANT } from '../../tenant.config.js'

marked.setOptions({ gfm: true, breaks: true })

export const legalNoticeMdClass =
  'legal-md max-w-none text-zinc-800 leading-relaxed ' +
  '[&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-zinc-900 [&_h1]:mb-4 ' +
  '[&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-zinc-900 [&_h2]:mt-6 [&_h2]:mb-2 ' +
  '[&_h3]:text-base [&_h3]:font-bold [&_h3]:text-zinc-800 [&_h3]:mt-4 ' +
  '[&_p]:mb-3 [&_p]:text-[15px] ' +
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 ' +
  '[&_strong]:text-zinc-900 ' +
  '[&_hr]:my-6 [&_hr]:border-zinc-200'

export function legalNoticeHtmlFromTenant() {
  const md = String(TENANT.legalNoticeMarkdown || '').trim()
  if (!md) return '<p class="text-zinc-500">No hay texto de aviso legal configurado.</p>'
  const raw = marked.parse(md)
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
}
