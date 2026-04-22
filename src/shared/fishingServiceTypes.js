/** Tipos de servicio del Directorio de Pesca (coinciden con `serviceTypes[]` en cada registro). */
export const FISHING_SERVICE_TYPES = [
  { id: 'lugar_pesca', label: 'Lugar de pesca' },
  { id: 'transporte', label: 'Transporte al lugar' },
  { id: 'venta_articulos', label: 'Venta artículos de pesca' },
  { id: 'alimentacion', label: 'Alimentación / restaurante' },
  { id: 'hospedaje', label: 'Hospedaje para pescadores' },
  { id: 'operador_turistico', label: 'Operador turístico (pesca)' },
  { id: 'bote_remero', label: 'Bote / remero / motor' },
  { id: 'curso_pesca', label: 'Curso de pesca' },
]

export function serviceTypeLabel(id) {
  return FISHING_SERVICE_TYPES.find((t) => t.id === id)?.label || id
}
