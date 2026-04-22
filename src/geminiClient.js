/**
 * Cliente Gemini (Google AI). Usa VITE_GEMINI_API_KEY.
 * Reintentos con backoff ante cualquier fallo de red o HTTP.
 */

import { TENANT } from './tenant.config.js'

function expandGeminiTemplate(raw) {
  return String(raw ?? '').replaceAll('{{clubName}}', TENANT.name)
}

function geminiPrompts() {
  return TENANT.geminiPrompts || {}
}

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 16000]
const MAX_FETCH_ATTEMPTS = 5

function readEnvBool(raw) {
  if (raw === undefined || raw === '') return false
  const s = String(raw).trim().toLowerCase()
  return s === 'true' || s === '1' || s === 'yes' || s === 'on'
}

/** Activa/desactiva toda la IA del sitio sin quitar la API key. En .env: VITE_AI_ENABLED=true|false */
function isAiFeatureEnabled() {
  return readEnvBool(import.meta.env.VITE_AI_ENABLED)
}

/** Solo el asistente al convertir propuesta → votación (modal en Propuestas). En .env: VITE_AI_PROPOSAL_CONVERT_POLL */
function isProposalConvertPollAiEnabled() {
  return readEnvBool(import.meta.env.VITE_AI_PROPOSAL_CONVERT_POLL)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeTextForComparison(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function applyLocalSpanishProofread(text) {
  let out = String(text || '')
  if (!out.trim()) return ''

  const accentMap = {
    identificacion: 'identificación',
    descripcion: 'descripción',
    informacion: 'información',
    ubicacion: 'ubicación',
    inscripcion: 'inscripción',
    reunion: 'reunión',
    sesion: 'sesión',
    comite: 'comité',
    administracion: 'administración',
    organizacion: 'organización',
    participacion: 'participación',
    invitacion: 'invitación',
    competicion: 'competición',
    edicion: 'edición',
    publicacion: 'publicación',
    preparacion: 'preparación',
    confirmacion: 'confirmación',
  }

  out = out
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])([^\s])/g, '$1 $2')
    .replace(/([A-Za-zÁÉÍÓÚÑáéíóúñ]{4,})y([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+)/g, '$1 y $2')
    .trim()

  // Corrige palabras pegadas con conjunción "y" al final (ej: "Identificaciony Manejo").
  out = out.replace(/\b([A-Za-zÁÉÍÓÚÑáéíóúñ]{5,})y\b(?=\s+[A-Za-zÁÉÍÓÚÑáéíóúñ])/g, (full, root) => {
    const lower = String(root).toLowerCase()
    if (lower.endsWith('gua') || lower.endsWith('h') || lower.endsWith('mu') || lower.endsWith('re')) {
      return full
    }
    return `${root} y`
  })

  out = out.replace(/\b([A-Za-zÁÉÍÓÚÑáéíóúñ]+)\b/g, (word) => {
    const lower = word.toLowerCase()
    const fixed = accentMap[lower]
    if (!fixed) return word
    if (word === lower) return fixed
    if (word[0] === word[0].toUpperCase()) return fixed.charAt(0).toUpperCase() + fixed.slice(1)
    return fixed
  })

  return out
}

let lastGeminiDetail = ''

export function getLastGeminiDetail() {
  return lastGeminiDetail
}

function getApiKey() {
  return (import.meta.env.VITE_GEMINI_API_KEY || '').trim()
}

function getModelId() {
  let v = String(import.meta.env.VITE_GEMINI_MODEL || '')
    .trim()
    .replace(/^\uFEFF/, '')
    .replace(/^['"]|['"]$/g, '')
    .replace(/^models\//i, '')
    .trim()
  if (!v) return DEFAULT_GEMINI_MODEL
  const lower = v.toLowerCase()
  if (lower.includes('gemini-1.5-pro') || lower.includes('-preview') || v.includes('@')) {
    return DEFAULT_GEMINI_MODEL
  }
  return v
}

function parseJsonFromResponse(data) {
  const c = data?.candidates?.[0]
  if (!c) return null
  if (c.finishReason && c.finishReason !== 'STOP' && c.finishReason !== 'MAX_TOKENS') {
    lastGeminiDetail = `Bloqueo o fin inesperado: ${c.finishReason}`
  }
  const raw = c.content?.parts?.[0]?.text
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    const m = String(raw).match(/\{[\s\S]*\}/)
    if (m) {
      try {
        return JSON.parse(m[0])
      } catch {
        return null
      }
    }
    return null
  }
}

async function generateJsonWithFallback(opts) {
  lastGeminiDetail = ''
  const proposalPollBypass =
    opts.allowWhenProposalConvertPoll === true && isProposalConvertPollAiEnabled()
  if (!isAiFeatureEnabled() && !proposalPollBypass) {
    lastGeminiDetail =
      'La IA está desactivada. Pon VITE_AI_ENABLED=true, o solo para convertir propuesta a votación: VITE_AI_PROPOSAL_CONVERT_POLL=true (con VITE_GEMINI_API_KEY). Reinicia el servidor de desarrollo o vuelve a desplegar.'
    return { data: null, ok: false }
  }
  const apiKey = getApiKey()
  if (!apiKey) {
    lastGeminiDetail = 'Falta VITE_GEMINI_API_KEY en .env'
    return { data: null, ok: false }
  }

  const model = getModelId()
  const fullUser = `${opts.systemText}\n\n${opts.userText}\n\n${opts.jsonShapeHint}`
  const temperature =
    typeof opts.temperature === 'number' && opts.temperature >= 0 && opts.temperature <= 2
      ? opts.temperature
      : 0.35

  const body = {
    contents: [{ parts: [{ text: fullUser }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  for (let attempt = 0; attempt < MAX_FETCH_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      const delayMs = RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)]
      await sleep(delayMs)
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data?.error?.message || `HTTP ${res.status}`
        lastGeminiDetail = `${model}: ${msg}`
        if (attempt < MAX_FETCH_ATTEMPTS - 1) continue
        return { data: null, ok: false }
      }
      const parsed = parseJsonFromResponse(data)
      if (parsed) {
        lastGeminiDetail = ''
        return { data: parsed, ok: true }
      }
      lastGeminiDetail = `${model}: respuesta sin JSON válido`
      if (attempt < MAX_FETCH_ATTEMPTS - 1) continue
      return { data: null, ok: false }
    } catch (e) {
      lastGeminiDetail = `${model}: ${e instanceof Error ? e.message : String(e)}`
      if (attempt < MAX_FETCH_ATTEMPTS - 1) continue
      return { data: null, ok: false }
    }
  }
  return { data: null, ok: false }
}

export async function polishSpanishField(kind, draft) {
  const P = geminiPrompts()
  const instructionRaw = P.polishKinds?.[kind]
  const instruction = instructionRaw ? expandGeminiTemplate(instructionRaw) : ''
  if (!instruction || !draft?.trim()) return null
  const original = draft.trim()
  const baseSystemText = `${instruction}${P.polishSpanishSuffix || ''}`
  const baseJsonHint = P.polishJsonHintSingleText || ''

  const first = await generateJsonWithFallback({
    systemText: baseSystemText,
    userText: `Texto a mejorar:\n"""${original}"""`,
    jsonShapeHint: baseJsonHint,
    temperature: 0.2,
  })
  if (!first.ok || !first.data) return null
  let text = typeof first.data.text === 'string' ? first.data.text.trim() : ''
  if (!text) return null

  if (normalizeTextForComparison(text) === normalizeTextForComparison(original)) {
    const second = await generateJsonWithFallback({
      systemText: `${baseSystemText}${P.polishSpanishRetrySuffix || ''}`,
      userText: `Texto a mejorar:\n"""${original}"""`,
      jsonShapeHint: `${baseJsonHint}${P.polishSpanishRetryJsonSuffix || ''}`,
      temperature: 0.25,
    })
    if (second.ok && second.data) {
      const retryText = typeof second.data.text === 'string' ? second.data.text.trim() : ''
      if (retryText) text = retryText
    }
  }
  if (normalizeTextForComparison(text) === normalizeTextForComparison(original)) {
    const third = await generateJsonWithFallback({
      systemText: P.polishStrictSpellcheckSystem || '',
      userText: `Corrige este texto y conserva su sentido:\n"""${original}"""`,
      jsonShapeHint: P.polishStrictSpellcheckJsonHint || '',
      temperature: 0,
    })
    if (third.ok && third.data) {
      const strictText = typeof third.data.text === 'string' ? third.data.text.trim() : ''
      if (strictText) text = strictText
    }
  }
  if (normalizeTextForComparison(text) === normalizeTextForComparison(original)) {
    const local = applyLocalSpanishProofread(original)
    if (normalizeTextForComparison(local) !== normalizeTextForComparison(original)) {
      text = local
    }
  }
  return text
}

export async function polishProposalDraft(draft) {
  const titleIn = String(draft?.title ?? '').trim()
  const excerptIn = String(draft?.excerpt ?? '').trim()
  if (!titleIn && !excerptIn) return null

  const P = geminiPrompts()
  const baseSystemText = expandGeminiTemplate(P.polishProposalDraftCore || '')
  const baseJsonHint = P.polishProposalDraftJsonHint || ''
  const first = await generateJsonWithFallback({
    systemText: baseSystemText,
    userText: `Título (puede estar vacío):\n"""${titleIn}"""\n\nDescripción breve (puede estar vacía):\n"""${excerptIn}"""`,
    jsonShapeHint: baseJsonHint,
    temperature: 0.2,
  })
  if (!first.ok || !first.data) return null

  let out = {
    title: typeof first.data.title === 'string' ? first.data.title.trim() : '',
    excerpt: typeof first.data.excerpt === 'string' ? first.data.excerpt.trim() : '',
  }

  const unchangedTitle = titleIn && normalizeTextForComparison(out.title) === normalizeTextForComparison(titleIn)
  const unchangedExcerpt = excerptIn && normalizeTextForComparison(out.excerpt) === normalizeTextForComparison(excerptIn)

  if (unchangedTitle || unchangedExcerpt) {
    const second = await generateJsonWithFallback({
      systemText: `${baseSystemText}${P.polishProposalDraftRetrySuffix || ''}`,
      userText: `Título (puede estar vacío):\n"""${titleIn}"""\n\nDescripción breve (puede estar vacía):\n"""${excerptIn}"""`,
      jsonShapeHint: `${baseJsonHint}${P.polishProposalDraftRetryJsonSuffix || ''}`,
      temperature: 0.25,
    })
    if (second.ok && second.data) {
      out = {
        title: typeof second.data.title === 'string' ? second.data.title.trim() : out.title,
        excerpt: typeof second.data.excerpt === 'string' ? second.data.excerpt.trim() : out.excerpt,
      }
    }
  }

  const stillUnchangedTitle = titleIn && normalizeTextForComparison(out.title) === normalizeTextForComparison(titleIn)
  const stillUnchangedExcerpt = excerptIn && normalizeTextForComparison(out.excerpt) === normalizeTextForComparison(excerptIn)
  if (stillUnchangedTitle || stillUnchangedExcerpt) {
    const third = await generateJsonWithFallback({
      systemText: P.polishProposalDraftSpellcheckSystem || '',
      userText: `Título (puede estar vacío):\n"""${titleIn}"""\n\nDescripción breve (puede estar vacía):\n"""${excerptIn}"""`,
      jsonShapeHint: P.polishProposalDraftSpellcheckJsonHint || '',
      temperature: 0,
    })
    if (third.ok && third.data) {
      out = {
        title: typeof third.data.title === 'string' ? third.data.title.trim() : out.title,
        excerpt: typeof third.data.excerpt === 'string' ? third.data.excerpt.trim() : out.excerpt,
      }
    }
  }

  if (titleIn && normalizeTextForComparison(out.title) === normalizeTextForComparison(titleIn)) {
    const localTitle = applyLocalSpanishProofread(titleIn)
    if (normalizeTextForComparison(localTitle) !== normalizeTextForComparison(titleIn)) {
      out.title = localTitle
    }
  }
  if (excerptIn && normalizeTextForComparison(out.excerpt) === normalizeTextForComparison(excerptIn)) {
    const localExcerpt = applyLocalSpanishProofread(excerptIn)
    if (normalizeTextForComparison(localExcerpt) !== normalizeTextForComparison(excerptIn)) {
      out.excerpt = localExcerpt
    }
  }

  return out
}

/** Gemini disponible para el modal «Convertir a Votación» (propuesta → encuesta), aunque VITE_AI_ENABLED esté en false. */
export function isProposalConvertPollGeminiConfigured() {
  return Boolean(getApiKey()) && (isAiFeatureEnabled() || isProposalConvertPollAiEnabled())
}

/**
 * Borrador de pregunta y opciones para convertir una propuesta en votación.
 * @param {{ title?: string, excerpt?: string }} proposal
 * @returns {Promise<{ question: string, suggestedOptions: string[] } | null>}
 */
export async function fetchGeminiProposalPollDraft(proposal) {
  const title = String(proposal?.title ?? '').trim()
  const excerpt = String(proposal?.excerpt ?? '').trim()
  if (!title && !excerpt) return null

  const P = geminiPrompts()
  const { data, ok } = await generateJsonWithFallback({
    allowWhenProposalConvertPoll: true,
    temperature: 0.35,
    systemText: expandGeminiTemplate(P.proposalPollDraftSystem || ''),
    userText: `Título de la propuesta:\n"""${title}"""\n\nDescripción breve:\n"""${excerpt || '(sin descripción)'}"""`,
    jsonShapeHint: P.proposalPollDraftJsonHint || '',
  })
  if (!ok || !data) return null
  const question = typeof data.question === 'string' ? data.question.trim() : ''
  const rawOpts = Array.isArray(data.suggestedOptions) ? data.suggestedOptions : []
  const suggestedOptions = rawOpts.map((o) => String(o ?? '').trim()).filter(Boolean)
  if (!question || suggestedOptions.length < 2) return null
  return { question, suggestedOptions }
}

export async function fetchGeminiSurveyOptions(question) {
  if (!question?.trim()) return null
  const P = geminiPrompts()
  const { data, ok } = await generateJsonWithFallback({
    systemText: expandGeminiTemplate(P.surveyOptionsSystem || ''),
    userText: `Pregunta de encuesta: "${question.trim()}"`,
    jsonShapeHint: P.surveyOptionsJsonHint || '',
  })
  if (!ok || !data?.suggestedOptions?.length) return null
  return { suggestedOptions: data.suggestedOptions }
}

export async function fetchGeminiDescriptionFromTitle(title, mode = 'proposal') {
  if (!title?.trim()) return null
  const P = geminiPrompts()
  const systemText =
    mode === 'talk'
      ? expandGeminiTemplate(P.descriptionTalk || '')
      : mode === 'event'
        ? expandGeminiTemplate(P.descriptionEvent || '')
        : expandGeminiTemplate(P.descriptionProposal || '')

  const { data, ok } = await generateJsonWithFallback({
    systemText,
    userText: `Título: "${title.trim()}"`,
    jsonShapeHint: P.descriptionFromTitleJsonHint || '',
  })
  if (!ok || !data) return null
  const description = String(data.description ?? data.text ?? '').trim()
  return description ? { description } : null
}

export async function fetchGeminiDuplicateCheck(newTitle, newExcerpt, existingItems) {
  if (!newTitle?.trim() || !existingItems?.length) return null

  const summary = existingItems
    .slice(0, 30)
    .map(
      (item, i) =>
        `${i + 1}. "${String(item.title || '').trim()}"${item.excerpt ? ': ' + String(item.excerpt).trim().slice(0, 120) : ''}`,
    )
    .join('\n')

  const P = geminiPrompts()
  const { data, ok } = await generateJsonWithFallback({
    temperature: 0.1,
    systemText: P.duplicateCheckSystem || '',
    userText: `Nueva entrada:\nTítulo: "${newTitle.trim()}"\nDescripción: "${String(newExcerpt || '').trim().slice(0, 300)}"\n\nEntradas existentes:\n${summary}`,
    jsonShapeHint: P.duplicateCheckJsonHint || '',
  })
  if (!ok || !data) return null
  return {
    hasSimilar: Boolean(data.hasSimilar),
    similarTitles: Array.isArray(data.similarTitles) ? data.similarTitles.filter(Boolean) : [],
  }
}

export function isGeminiConfigured() {
  return isAiFeatureEnabled() && Boolean(getApiKey())
}
