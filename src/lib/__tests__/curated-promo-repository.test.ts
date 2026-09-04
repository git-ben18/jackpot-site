import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { curatedPromoDiscoveryViewRows } from "../__fixtures__/curatedPromoDiscoveryRow.fixtures";
import { mapCuratedPromoDiscoveryRow } from "../mappers/curatedPromoDiscoveryMapper";
import { loadFixtureCuratedPromos } from "../server/curatedPromoFixtures";
import {
  CURATED_PROMO_DISCOVERY_COLUMNS,
  CURATED_PROMO_DISCOVERY_DEFAULT_LIMIT,
  CURATED_PROMO_DISCOVERY_MAX_LIMIT,
  CURATED_PROMO_DISCOVERY_SELECT,
  CURATED_PROMO_DISCOVERY_VIEW,
  queryCuratedPromos,
  resolveCuratedPromoLimit,
  type CuratedPromoQueryBuilder,
  type CuratedPromoQueryClient,
  type CuratedPromoQueryResponse,
} from "../server/curatedPromoQuery";
import {
  PUBLIC_SUPABASE_ANON_KEY_ENV,
  PUBLIC_SUPABASE_PUBLISHABLE_KEY_ENV,
  PUBLIC_SUPABASE_URL_ENV,
  readPublicSupabaseConfig,
} from "../server/publicSupabaseConfig";

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

const envKeys = [
  PUBLIC_SUPABASE_URL_ENV,
  PUBLIC_SUPABASE_PUBLISHABLE_KEY_ENV,
  PUBLIC_SUPABASE_ANON_KEY_ENV,
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of envKeys) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
});

function createMockClient(result: CuratedPromoQueryResponse) {
  const captured: {
    from?: string;
    select?: string;
    order?: { column: string; options: { ascending: boolean } };
    in?: { column: string; values: readonly string[] };
    limit?: number;
  } = {};

  const builder = {
    select(columns: string) {
      captured.select = columns;
      return builder;
    },
    order(column: string, options: { ascending: boolean }) {
      captured.order = { column, options };
      return builder;
    },
    in(column: string, values: readonly string[]) {
      captured.in = { column, values };
      return builder;
    },
    limit(count: number) {
      captured.limit = count;
      return builder;
    },
    then(
      resolve: (value: CuratedPromoQueryResponse) => unknown,
      reject?: (reason: unknown) => unknown,
    ) {
      return Promise.resolve(result).then(resolve, reject);
    },
  } as CuratedPromoQueryBuilder;

  const client: CuratedPromoQueryClient = {
    from(relation: string) {
      captured.from = relation;
      return builder;
    },
  };

  return { captured, client };
}

describe("S3-E public Supabase config", () => {
  it("fails closed when URL or low-privilege key is missing", () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "should-never-be-read";

    const config = readPublicSupabaseConfig();
    assert.equal(config.ok, false);
    if (!config.ok) {
      assert.equal(config.code, "missing_config");
      assert.equal(config.message.includes("SERVICE_ROLE"), false);
    }
  });

  it("prefers publishable key and ignores service-role if present", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "should-never-be-read";
    delete process.env.SUPABASE_ANON_KEY;

    const config = readPublicSupabaseConfig();
    assert.deepEqual(config, {
      ok: true,
      url: "https://example.supabase.co",
      key: "sb_publishable_test",
      keyKind: "publishable",
    });
  });

  it("uses anon key only as explicit compatibility fallback", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    process.env.SUPABASE_ANON_KEY = "anon-compat";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "should-never-be-read";

    const config = readPublicSupabaseConfig();
    assert.deepEqual(config, {
      ok: true,
      url: "https://example.supabase.co",
      key: "anon-compat",
      keyKind: "anon",
    });
  });
});

describe("S3-E curated promo query", () => {
  it("queries only the approved view and selected-column allowlist", async () => {
    const { captured, client } = createMockClient({ data: [], error: null });
    const result = await queryCuratedPromos(client);

    assert.equal(result.ok, true);
    assert.equal(captured.from, CURATED_PROMO_DISCOVERY_VIEW);
    assert.equal(captured.select, CURATED_PROMO_DISCOVERY_SELECT);
    assert.equal(captured.select?.includes("*"), false);
    assert.deepEqual([...CURATED_PROMO_DISCOVERY_COLUMNS], [
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
    ]);
    assert.deepEqual(captured.order, { column: "observed_at", options: { ascending: false } });
    assert.deepEqual(captured.in, {
      column: "active_status",
      values: ["active", "unknown"],
    });
    assert.equal(captured.limit, CURATED_PROMO_DISCOVERY_DEFAULT_LIMIT);
  });

  it("enforces default and max limits", () => {
    assert.equal(resolveCuratedPromoLimit(undefined), 50);
    assert.equal(resolveCuratedPromoLimit(3), 3);
    assert.equal(resolveCuratedPromoLimit(1000), CURATED_PROMO_DISCOVERY_MAX_LIMIT);
  });

  it("maps rows through the S3-B mapper and does not attach overlaps", async () => {
    const row = curatedPromoDiscoveryViewRows[0];
    const { client } = createMockClient({ data: [row], error: null });
    const result = await queryCuratedPromos(client, { activeOnly: false, limit: 10 });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.promos, [mapCuratedPromoDiscoveryRow(row)]);
      assert.equal("eventOverlaps" in result.promos[0], false);
    }
  });

  it("fails closed on query error and does not return fixtures", async () => {
    const { client } = createMockClient({
      data: null,
      error: { message: "permission denied for table secrets" },
    });
    const result = await queryCuratedPromos(client);

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "query_failed");
      assert.equal(result.message, "Curated promo discovery query failed.");
      assert.equal(result.message.includes("permission denied"), false);
    }
  });
});

describe("S3-E opt-in fixtures", () => {
  it("loads mapped fixtures only through the named opt-in helper", () => {
    const promos = loadFixtureCuratedPromos(2);
    assert.equal(promos.length, 2);
    assert.equal(promos[0].promoId, "mock-promo-venetian-freeplay");
  });
});

describe("S3-E excluded-import audit", () => {
  it("keeps service-role, artifact-queries, and silent mock fallback out of the repository", () => {
    const files = [
      "lib/server/publicSupabaseConfig.ts",
      "lib/server/publicSupabase.ts",
      "lib/server/curatedPromoQuery.ts",
      "lib/server/curatedPromoRepository.ts",
      "lib/server/curatedPromoFixtures.ts",
      "app/page.tsx",
    ];
    const forbidden = [
      "SUPABASE_SERVICE_ROLE_KEY",
      "getSupabaseAdminClient",
      "artifact-queries",
      "supabase-server",
      "CURATED_PROMO_DISCOVERY_MOCK",
      "published_curated_offer_event_overlaps",
    ];

    for (const relative of files) {
      const source = readFileSync(join(srcRoot, relative), "utf8");
      for (const token of forbidden) {
        assert.equal(source.includes(token), false, `${relative} must not contain ${token}`);
      }
    }

    const repository = readFileSync(join(srcRoot, "lib/server/curatedPromoRepository.ts"), "utf8");
    assert.equal(repository.includes("loadFixtureCuratedPromos"), false);
    assert.equal(repository.includes("curatedPromoFixtures"), false);
  });
});
