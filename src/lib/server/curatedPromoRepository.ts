import "server-only";

import { createPublicSupabaseClient } from "./publicSupabase";
import {
  queryCuratedPromos,
  type CuratedPromoQueryClient,
  type GetCuratedPromosParams,
  type GetCuratedPromosResult,
} from "./curatedPromoQuery";

export type { GetCuratedPromosParams, GetCuratedPromosResult } from "./curatedPromoQuery";
export {
  CURATED_PROMO_DISCOVERY_COLUMNS,
  CURATED_PROMO_DISCOVERY_DEFAULT_LIMIT,
  CURATED_PROMO_DISCOVERY_MAX_LIMIT,
  CURATED_PROMO_DISCOVERY_SELECT,
  CURATED_PROMO_DISCOVERY_VIEW,
  resolveCuratedPromoLimit,
} from "./curatedPromoQuery";

/**
 * Domain API for published curated promos.
 * Reimplemented public-read API. Does not copy the source server helper or admin client.
 * Does not fall back to fixtures on live failure (D-S3-08).
 */
export async function getCuratedPromos(
  params: GetCuratedPromosParams = {},
  deps?: { client?: CuratedPromoQueryClient },
): Promise<GetCuratedPromosResult> {
  if (deps?.client) {
    return queryCuratedPromos(deps.client, params);
  }

  const created = createPublicSupabaseClient();
  if (!created.ok) {
    return created;
  }

  return queryCuratedPromos(created.client as unknown as CuratedPromoQueryClient, params);
}
