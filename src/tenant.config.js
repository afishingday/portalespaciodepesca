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
   * Id de contexto para reacciones (Firestore). En otro despliegue (ej. Las Blancas) usa un valor distinto, p. ej. `'lasBlancas'`.
   */
  reactionAppContextId: 'espacioPesca',

  /**
   * Categorías del listado «Información de interés» (filtro y formulario de publicación).
   * En Las Blancas puedes sustituir por ej. `['General', 'Instalaciones', 'Torneos', 'Comunicados', 'Otros']`.
   */
  newsCategories: [
    'General',
    'Salidas',
    'Torneo',
    'Normativa',
    'Charla',
    'Mantenimiento',
    'Proyectos',
    'Recursos',
    'Otros',
  ],

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
    directoryDuplicateCheckSystem:
      'Eres asistente del portal de pesca {{clubName}} en Colombia. Revisas si una NUEVA ficha del Directorio de Pesca es el mismo negocio o persona que una ficha YA EXISTENTE.\n\n' +
      'Marca riesgo de duplicado SOLO cuando sea muy probable que sea el mismo proveedor:\n' +
      '- Mismo teléfono, mismo @ de red, mismo correo, o nombre casi idéntico salvo espacios/puntuación (ej. "AF Fishing" y "AFFishing" → duplicado).\n\n' +
      'NO marques duplicado si son negocios distintos aunque el nombre suene parecido, por ejemplo:\n' +
      '- "Colombia Fishing Trips" vs "Colombia Fishing Tours" → son diferentes (Trips vs Tours), hasDuplicateRisk debe ser false.\n\n' +
      'Sé conservador: en duda razonable, hasDuplicateRisk false.',
    directoryDuplicateCheckJsonHint:
      'Responde únicamente JSON con esta forma exacta: {"hasDuplicateRisk":boolean,"reason":"una frase breve en español","matchingNames":string[]}. ' +
      'matchingNames: nombres EXACTOS de fichas existentes que consideras el mismo registro (vacío si ninguna). Si no hay riesgo, hasDuplicateRisk false y reason puede ser "".',
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
   * Términos y condiciones del portal.
   * Cambiar `termsVersion` fuerza a todos los usuarios a aceptar nuevamente en su próximo acceso.
   * Reemplazar los placeholders [NOMBRE COMPLETO] y [NÚMERO DE CÉDULA] antes del primer deploy.
   */
  legal: {
    termsVersion: '1.0',
    termsUpdatedAt: '2026-04-26',
    ownerName: 'Luis Fernando Montoya Mejia',
    ownerDoc: 'C.C. 8100898',
    contact: 'luistyle@gmail.com',
    sections: [
      {
        title: 'Propiedad Intelectual',
        body: 'Este portal y todo su código fuente son propiedad exclusiva de su desarrollador, protegidos por la Ley 23 de 1982, la Decisión 351 de la CAN y la Ley 1915 de 2018. El acceso al portal no implica cesión de derechos sobre el software, su diseño ni sus componentes.',
      },
      {
        title: 'Licencia de Uso',
        body: 'Se otorga a los miembros de la comunidad Espacio de Pesca una licencia de uso personal, intransferible y revocable para acceder al portal exclusivamente con fines recreativos y organizativos del grupo. Esta comunidad tiene carácter informal y no constituye club, asociación ni persona jurídica.',
      },
      {
        title: 'Privacidad de Datos',
        body: 'Los datos personales ingresados (nombre, usuario, teléfono) se almacenan en servidores de Google Firebase con el fin de gestionar el acceso y la comunicación de la comunidad. El tratamiento se realiza conforme a la Ley 1581 de 2012 (Habeas Data). No se comparten datos con terceros. El usuario tiene derecho a conocer, actualizar, rectificar y suprimir su información personal, y a revocar su autorización de tratamiento en cualquier momento. Para ejercer estos derechos escribir a luistyle@gmail.com. También puede presentar reclamaciones ante la Superintendencia de Industria y Comercio (www.sic.gov.co).',
      },
      {
        title: 'Uso Aceptable',
        body: 'El portal debe usarse de manera respetuosa y en beneficio de la comunidad de pesca. Queda prohibido publicar contenido ofensivo, falso o que vulnere los derechos de otros miembros. El administrador podrá suspender el acceso ante infracciones graves.',
      },
      {
        title: 'Limitación de Responsabilidad',
        body: 'El desarrollador no es responsable por el contenido publicado por los usuarios, decisiones tomadas con base en la información del portal, interrupciones del servicio ni fallas de terceros (Firebase, Google). El portal se ofrece como herramienta de apoyo comunitario sin garantías de disponibilidad continua.',
      },
      {
        title: 'Vigencia y Modificaciones',
        body: 'Estos términos entran en vigor desde la primera aceptación y permanecen vigentes mientras el usuario tenga acceso al portal. El desarrollador podrá actualizarlos notificando mediante el mismo portal. El uso continuado después de una actualización implica la aceptación de los nuevos términos.',
      },
    ],
  },

  /**
   * Valores por defecto de configuración pública.
   */
  defaults: {
    contactPhone: '+57 301 639 4349',
    contactEmail: 'espaciodepesca@gmail.com',
    instagram: '@afishingday',
  },
}
