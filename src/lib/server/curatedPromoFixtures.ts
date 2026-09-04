/**
 * Opt-in fixture loader for tests and explicit local composition.
 * Never imported by getCuratedPromos. Not a production fallback (D-S3-08).
 */
import { mapFixtureCuratedPromos } from "../__fixtures__/curatedPromoDiscoveryDto.fixtures";
import type { CuratedPromoDiscoveryDTO } from "../../types/curatedPromos";
import {
  CURATED_PROMO_DISCOVERY_DEFAULT_LIMIT,
  resolveCuratedPromoLimit,
} from "./curatedPromoQuery";

export function loadFixtureCuratedPromos(
  limit: number = CURATED_PROMO_DISCOVERY_DEFAULT_LIMIT,
): CuratedPromoDiscoveryDTO[] {
  return mapFixtureCuratedPromos().slice(0, resolveCuratedPromoLimit(limit));
}
