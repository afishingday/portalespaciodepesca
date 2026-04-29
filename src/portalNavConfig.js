import { PORTAL_CONTENT_SECTION_IDS, PORTAL_SECTION_LABELS } from './shared/portalSectionConfig.js'

export function getUserTogglableNavItems() {
  return PORTAL_CONTENT_SECTION_IDS
    .filter((id) => id !== 'legal')
    .map((id) => ({ id, label: PORTAL_SECTION_LABELS[id] || id }))
}
