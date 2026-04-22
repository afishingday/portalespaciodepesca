/**
 * Configuración del portal (marca y textos). Comunidad informal; no implica entidad jurídica ni membresía asociativa.
 * Al crear un nuevo cliente: clonar el repo, editar este archivo, y hacer deploy.
 */
export const TENANT = {
  /** Nombre corto (sidebar, títulos, etc.) */
  name: 'Espacio de Pesca',

  /** Nombre completo para el título del portal y el browser tab */
  fullName: 'Portal Comunitario Espacio de Pesca',

  /** Lema */
  slogan: 'Compartir sin Competir',

  /** Descripción breve para textos legales / login (comunidad informal, sin implicar club constituido) */
  locationDescription: 'comunidad informal Espacio de Pesca',

  /** Username del superadmin */
  superadminUsername: 'Admin',

  /** Usernames con rol admin (editores de contenido) */
  adminUsernames: ['afishingday', 'dayrolongas'],

  /**
   * Usuarios exentos de forzar cambio de contraseña al primer login.
   * Dejar solo cuentas de servicio o prueba; quienes reciban clave inicial al aprobarse deben cambiarla.
   */
  forcePwdExempt: ['Admin'],

  /**
   * Contraseña por defecto del portal: clave inicial al aprobar solicitudes y valor al que migra la clave antigua `Club2026!!`.
   * Para cambiarla en todo el sistema, edita solo esta cadena y vuelve a desplegar.
   */
  portalDefaultPassword: 'Espacio2026!!',

  /** Etiqueta visible en tarjetas de la sección de servicios entre personas registradas (diferente al directorio). */
  memberServiceCardBadge: 'Servicio en la comunidad',

  /** Etiqueta visible en fichas del directorio de pesca. */
  directoryCardBadge: 'Directorio de pesca',

  /** Imágenes de avatar: carpeta `src/assets/icons` (ver `profileAvatarIcons.js`). */

  /**
   * Instrucciones para la IA (Gemini). Usa {{clubName}} como nombre corto de la marca (comunidad / portal).
   */
  geminiPrompts: {
    polishJsonHintSingleText:
      'Responde únicamente un objeto JSON con exactamente esta forma: {"text":"aquí va el texto mejorado"}. Sin markdown ni texto fuera del JSON.',
    polishSpanishRetrySuffix:
      ' Si detectas errores, debes devolver una versión corregida distinta al original.',
    polishSpanishRetryJsonSuffix:
      ' Importante: si corriges errores, no devuelvas exactamente el mismo texto.',
    polishStrictSpellcheckSystem:
      'Eres corrector ortográfico estricto de español. Corrige tildes, puntuación, errores de digitación y gramática leve sin cambiar el significado.',
    polishStrictSpellcheckJsonHint:
      'Responde únicamente JSON con esta forma exacta: {"text":"texto corregido"} . Aunque el cambio sea mínimo (por ejemplo tildes), devuelve la versión corregida.',
    polishSpanishSuffix:
      ' El usuario escribe en español. Corrige ortografía, tildes, puntuación y gramática SIEMPRE que haya errores, sin cambiar la idea ni inventar datos.',
    polishKinds: {
      news_title:
        'Mejora este título de noticia para el portal del club de pesca {{clubName}} en Colombia: más claro, entusiasta y atractivo. Máximo 120 caracteres.',
      news_excerpt: 'Mejora este resumen corto de noticia para un club de pesca: tono cercano y dinámico, una o dos frases.',
      news_content:
        'Mejora este cuerpo de noticia para un club de pesca: párrafos claros, tono apasionado y comunitario. Conserva hechos; no inventes datos.',
      proposal_title:
        'Mejora el título de esta propuesta en el club {{clubName}}: claro y motivador. Máximo 140 caracteres.',
      proposal_excerpt:
        'Mejora la descripción de una propuesta para un club de pesca en Colombia: 2–4 frases, tono entusiasta y cercano.',
      poll_title: 'Mejora el título de esta votación para el club de pesca {{clubName}}: claro y motivador.',
      poll_excerpt:
        'Mejora este contexto breve de una votación para personas con cuenta en el portal de pesca: explica en 1-2 frases por qué importa la decisión, tono claro y neutral.',
      poll_question:
        'Mejora la redacción de esta pregunta de votación para personas con cuenta en el portal de pesca: neutra, clara y sin sesgo. Una sola pregunta bien formulada.',
      event_title: 'Mejora este título de evento para el club de pesca {{clubName}}: claro, atractivo y específico.',
      event_description:
        'Mejora esta descripción de evento para un club de pesca: incluye propósito, qué llevar o esperar y tono motivador, sin inventar fechas o datos no dados.',
      talk_title: 'Mejora el título de esta charla para un club de pesca: claro, específico y atractivo para pescadores.',
      talk_excerpt: 'Mejora el resumen de esta charla sobre pesca deportiva: 2–3 frases, tono educativo y apasionado.',
      record_notes: 'Mejora las notas de este récord de pesca: preciso, vibrante y que inspire a quienes participan en el portal.',
    },
    polishProposalDraftCore:
      'Eres editor para el muro de propuestas del club de pesca {{clubName}} en Colombia. Mejora ortografía, tildes, puntuación y redacción sin cambiar el sentido ni inventar hechos.',
    polishProposalDraftJsonHint:
      'Responde únicamente JSON con exactamente esta forma: {"title":"...","excerpt":"..."}. Si el título de entrada estaba vacío, devuelve title como "". Si la descripción de entrada estaba vacía, devuelve excerpt como "". Máximo 120 caracteres para título, 2–4 frases para descripción.',
    polishProposalDraftRetrySuffix:
      ' Si hay errores ortográficos o de puntuación, debes corregirlos y devolver cambios visibles.',
    polishProposalDraftRetryJsonSuffix:
      ' Importante: corrige errores ortográficos del texto original cuando existan.',
    polishProposalDraftSpellcheckSystem:
      'Eres corrector ortográfico estricto de español para títulos y textos breves. Corrige tildes, puntuación y errores de digitación sin alterar el sentido.',
    polishProposalDraftSpellcheckJsonHint:
      'Responde únicamente JSON con esta forma exacta: {"title":"...","excerpt":"..."}. Conserva campos vacíos cuando lleguen vacíos.',
    proposalPollDraftSystem:
      'Eres asistente del portal de pesca {{clubName}} en Colombia. Debes redactar el borrador de una votación para que las personas con cuenta registrada opinen sobre una propuesta del muro. Tono claro, respetuoso y neutral.',
    proposalPollDraftJsonHint:
      'Responde únicamente JSON con esta forma exacta: {"question":"una sola pregunta clara","suggestedOptions":["opción1","opción2","opción3"]}. ' +
      'Pueden ser 4 opciones. Cada opción: texto corto (máximo 60 caracteres), sin comas ni punto y coma dentro del texto. ' +
      'Incluye al menos una opción tipo duda o más información. Puedes empezar cada opción con un emoji relacionado a pesca o naturaleza.',
    surveyOptionsSystem:
      'Eres asistente para encuestas de un club de pesca en Colombia ({{clubName}}). Devuelve 3 u 4 opciones de respuesta cortas, cada una empezando con un emoji relacionado a pesca o naturaleza.',
    surveyOptionsJsonHint:
      'Responde únicamente JSON: {"suggestedOptions":["opción1","opción2","opción3"]} (puede haber 4 strings). Sin markdown.',
    descriptionTalk:
      'Redacta en español un resumen breve de una charla de pesca deportiva para el portal {{clubName}}: qué se aprenderá, beneficio para quienes participan y tono entusiasta. No inventes nombres ni fechas.',
    descriptionEvent:
      'Redacta en español una descripción breve de un evento para el portal de pesca {{clubName}}: objetivo, dinámica general y beneficio para quienes participan, en tono motivador. No inventes fechas, lugares ni datos no proporcionados.',
    descriptionProposal:
      'Redacta en español una descripción breve de la propuesta para el portal de pesca {{clubName}}: qué se busca, beneficio para la comunidad y tono respetuoso. No inventes montos ni fechas.',
    descriptionFromTitleJsonHint:
      'Responde únicamente JSON con una sola clave: {"description":"2 o 3 oraciones formales, sin inventar datos"}.',
    duplicateCheckSystem:
      'Eres asistente para un club de pesca en Colombia. Identifica si la nueva entrada es semánticamente similar (misma idea central) a alguna de las existentes. Sé estricto: solo marca similitud si el tema central es realmente el mismo.',
    duplicateCheckJsonHint:
      'Responde solo JSON: {"hasSimilar":boolean,"similarTitles":string[]}. similarTitles: títulos exactos de las entradas similares (array vacío si ninguna).',
  },

  /**
   * Aviso legal comunitario (Markdown). Se muestra en la sección «Aviso legal», enlace en el pie y modal desde el login.
   */
  legalNoticeMarkdown: `# 🎣 AVISO LEGAL – ESPACIO DE PESCA

Este grupo es una comunidad informal de amigos y conocidos que comparten el interés por la pesca recreativa.

## 1. Naturaleza del grupo

**«Espacio de Pesca»** no constituye una entidad legal, empresa, corporación ni organización formal. No existe relación contractual entre sus integrantes.

## 2. Participación voluntaria

Todas las actividades, encuentros o salidas de pesca son de carácter voluntario. Cada participante asiste bajo su propia responsabilidad.

## 3. Responsabilidad individual

Cada integrante es responsable de su seguridad, equipo, transporte y comportamiento durante las actividades. El grupo y sus administradores no se hacen responsables por accidentes, pérdidas, daños o cualquier situación que ocurra durante las salidas, charlas y otras actividades.

## 4. Organización de actividades

Las salidas o eventos que se propongan dentro del grupo son iniciativas informales entre participantes y no representan una organización oficial.

## 5. Aportes económicos

En caso de que se realicen aportes voluntarios para cubrir gastos (por ejemplo transporte, alimentación, logística), estos no constituyen pago por servicios ni generan obligaciones legales.

## 6. Conducta y respeto

Se espera que quienes usen el portal o participen en la comunidad actúen con respeto, responsabilidad y en cumplimiento de las normas locales, ambientales y de pesca.

Al participar, se entiende que la persona ha leído y acepta este aviso. Tener una cuenta en el portal no implica membresía de asociación ni relación laboral o mercantil con los administradores.

---

🎣 **¡Buena pesca para todos!**`,

  /**
   * Valores por defecto de configuración pública.
   */
  defaults: {
    contactPhone: '+57 301 639 4349',
    contactEmail: 'espaciodepesca@gmail.com',
    instagram: '@afishingday',
  },
}
