import {
  mapCuratedPromoDiscoveryRow,
  type CuratedPromoDiscoveryRow,
} from "../mappers/curatedPromoDiscoveryMapper";
import type { CuratedPromoDiscoveryDTO } from "../../types/curatedPromos";

export const CURATED_PROMO_DISCOVERY_VIEW = "v_curated_promo_discovery";
export const CURATED_PROMO_DISCOVERY_DEFAULT_LIMIT = 50;
export const CURATED_PROMO_DISCOVERY_MAX_LIMIT = 100;

export const CURATED_PROMO_DISCOVERY_COLUMNS = [
  "promo_id",
  "promo_slug",
  "brand",
  "market_slug",
  "location_label",
  "title",
  "subtitle",
  "source_kind",
  "source_url",
  "primary_asset_url",
  "active_status",
  "visible_start_date",
  "visible_end_date",
  "observed_at",
  "signal_families",
  "signal_types",
  "gameplay_tags",
  "badges",
  "top_signals_json",
  "signals_json",
  "evidence_json",
] as const;

export const CURATED_PROMO_DISCOVERY_SELECT = CURATED_PROMO_DISCOVERY_COLUMNS.join(", ");

const ACTIVE_ONLY_STATUSES = ["active", "unknown"] as const;

export type GetCuratedPromosParams = {
  activeOnly?: boolean;
  limit?: number;
};

export type GetCuratedPromosResult =
  | { ok: true; promos: CuratedPromoDiscoveryDTO[] }
  | { ok: false; code: "missing_config" | "query_failed"; message: string };

export type CuratedPromoQueryResponse = {
  data: unknown[] | null;
  error: { message?: string } | null;
};

export type CuratedPromoQueryBuilder = {
  select: (columns: string) => CuratedPromoQueryBuilder;
  order: (column: string, options: { ascending: boolean }) => CuratedPromoQueryBuilder;
  in: (column: string, values: readonly string[]) => CuratedPromoQueryBuilder;
  limit: (count: number) => CuratedPromoQueryBuilder;
  then: (
    resolve: (value: CuratedPromoQueryResponse) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

export type CuratedPromoQueryClient = {
  from: (relation: string) => CuratedPromoQueryBuilder;
};

export function resolveCuratedPromoLimit(limit?: number): number {
  if (limit == null || Number.isNaN(limit)) {
    return CURATED_PROMO_DISCOVERY_DEFAULT_LIMIT;
  }
  return Math.max(1, Math.min(CURATED_PROMO_DISCOVERY_MAX_LIMIT, Math.floor(limit)));
}

function mapRowsSafely(rows: CuratedPromoDiscoveryRow[]): CuratedPromoDiscoveryDTO[] {
  const mapped: CuratedPromoDiscoveryDTO[] = [];
  for (const row of rows) {
    try {
      mapped.push(mapCuratedPromoDiscoveryRow(row));
    } catch {
      // Skip malformed rows. Do not attach overlaps or fail the whole page.
    }
  }
  return mapped;
}

export async function queryCuratedPromos(
  client: CuratedPromoQueryClient,
  params: GetCuratedPromosParams = {},
): Promise<GetCuratedPromosResult> {
  const activeOnly = params.activeOnly ?? true;
  const limit = resolveCuratedPromoLimit(params.limit);

  try {
    let query = client
      .from(CURATED_PROMO_DISCOVERY_VIEW)
      .select(CURATED_PROMO_DISCOVERY_SELECT)
      .order("observed_at", { ascending: false });

    if (activeOnly) {
      query = query.in("active_status", ACTIVE_ONLY_STATUSES);
    }

    const { data, error } = (await query.limit(limit)) as CuratedPromoQueryResponse;

    if (error) {
      return {
        ok: false,
        code: "query_failed",
        message: "Curated promo discovery query failed.",
      };
    }

    const promos = mapRowsSafely((data ?? []) as CuratedPromoDiscoveryRow[]);
    return { ok: true, promos };
  } catch {
    return {
      ok: false,
      code: "query_failed",
      message: "Curated promo discovery query failed.",
    };
  }
}
