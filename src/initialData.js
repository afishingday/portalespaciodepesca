import { TENANT } from './tenant.config.js'
import { PORTAL_DEFAULT_PASSWORD } from './shared/portalAuthConstants.js'
import { defaultSectionVisibility, mergeSectionOrder } from './shared/portalSectionConfig.js'

export const PORTAL_USERS_CONFIG_VERSION = 'fishing-club-v1-20260421'

const ADMIN_USERNAMES = new Set(TENANT.adminUsernames)

export function buildDefaultUsers() {
  return [
    {
      username: 'afishingday',
      password: 'Sofia2016!!',
      role: 'admin',
      name: 'Luis Montoya',
      phone: '',
      blocked: false,
      avatar: '',
    },
    {
      username: 'dayrolongas',
      password: 'Admin2026!!',
      role: 'admin',
      name: 'Dayro Longas',
      phone: '',
      blocked: false,
      avatar: '',
    },
    {
      username: 'andresquiroz',
      password: PORTAL_DEFAULT_PASSWORD,
      role: 'member',
      name: 'Andres Quiroz',
      phone: '',
      blocked: false,
      avatar: '',
    },
  ]
}

export const INITIAL_DATA = {
  users: [
    ...buildDefaultUsers(),
    {
      username: TENANT.superadminUsername,
      password: `${TENANT.superadminUsername}2026`,
      role: 'superadmin',
      name: 'Administrador',
      phone: '',
      blocked: false,
      avatar: '',
    },
  ],
  pendingUsers: [],
  news: [],
  proposals: [],
  polls: [],
  events: [],
  records: [],
  talks: [],
  bitacora: [],
  communityPosts: [],
  directoryEntries: [],
  logs: [],
}

export const EMPTY_DB = {
  users: [],
  pendingUsers: [],
  news: [],
  proposals: [],
  polls: [],
  events: [],
  records: [],
  talks: [],
  bitacora: [],
  communityPosts: [],
  directoryEntries: [],
  logs: [],
  settings: { sections: defaultSectionVisibility(), sectionOrder: mergeSectionOrder(null) },
}

/** Catálogo de especies desde `src/content/species/*.md` (Lasso et al. 2019, reescrito). */
export { SPECIES_CATALOG } from './data/speciesCatalog.js'

/** Consejos rápidos de pesca. */
export const FISHING_TIPS = [
  'En embalses muy claros (>1.5m), aléjate de la orilla 12m y usa fluorocarbono <15 lb.',
  'Embalse con nivel alto: lanza adentro de los matojos usando plásticos sin plomo.',
  "Sábalo Real: Cuando salte, hazle una 'reverencia' (baja la punta de la vara para no reventar la línea).",
  "Ríos: Busca las 'costuras', esa línea invisible donde el agua rápida choca con el agua lenta. Allí cazan los depredadores.",
  "Bass matutino: Usa Poppers de 7-8cm con ritmo de 'bop, bop' lento.",
  'Dorada y Cachama de Río: Lanza tu cebo simulando el sonido \'plop\' de una fruta cayendo desde los árboles de la orilla.',
  'Payara: Su boca es puro hueso. Da 2 o 3 tirones fuertes (hooksets) para clavar el anzuelo al sentir el pique.',
  'Agua Sucia: Barrido de orilla con colores vivos (chartreuse) y recogida lenta.',
  'Sabaleta de Río: El sigilo lo es todo. Lanza río arriba y deja que la corriente baje el señuelo hacia las piedras.',
  'El Pirarucú rola (respira) cada 15-20 min. Lanza detrás de la estela que deja en la superficie.',
]
