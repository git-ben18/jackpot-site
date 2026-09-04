import type { CuratedPromoDiscoveryDTO } from '../../types/curatedPromos'
import { mapCuratedPromoDiscoveryRow } from '../mappers/curatedPromoDiscoveryMapper'
import { curatedPromoDiscoveryViewRows } from './curatedPromoDiscoveryRow.fixtures'

/** Mapped public DTOs for fixture-driven composed UI. Not a production fallback. */
export function mapFixtureCuratedPromos(): CuratedPromoDiscoveryDTO[] {
  return curatedPromoDiscoveryViewRows.map(mapCuratedPromoDiscoveryRow)
}
