import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_CURATED_PROMO_FILTERS } from "../../types/curatedPromos";
import { buildCuratedPromoFilterOptions } from "../curated-promo-display";
import { mapFixtureCuratedPromos } from "../__fixtures__/curatedPromoDiscoveryDto.fixtures";
import CuratedPromoCard from "../../components/v2/curated-promos/CuratedPromoCard";
import CuratedPromoCarousel from "../../components/v2/curated-promos/CuratedPromoCarousel";
import CuratedPromoDetailSheet from "../../components/v2/curated-promos/CuratedPromoDetailSheet";
import CuratedPromoDiscoveryWidget from "../../components/v2/curated-promos/CuratedPromoDiscoveryWidget";
import CuratedPromoFilterChips from "../../components/v2/curated-promos/CuratedPromoFilterChips";

const fixturePromos = mapFixtureCuratedPromos();
const fixturePromo = fixturePromos[0];
const srcRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

const composedFiles = [
  "components/v2/curated-promos/CuratedPromoFilterChips.tsx",
  "components/v2/curated-promos/CuratedPromoCarousel.tsx",
  "components/v2/curated-promos/CuratedPromoCard.tsx",
  "components/v2/curated-promos/CuratedPromoDetailSheet.tsx",
  "components/v2/curated-promos/CuratedPromoDiscoveryWidget.tsx",
  "lib/constants/nicheMap.ts",
];

const forbidden = [
  "useTracker",
  "log-interaction",
  "log-click",
  "curated-offer-event-overlap",
  "event-display",
  "artifact-queries",
  "supabase-server",
  "@supabase/supabase-js",
  "LandingDashboardClient",
  "HottestOffersCard",
];

describe("S3-D composed curated presentation", () => {
  it("renders FilterChips from mapped fixture filter options", () => {
    const options = buildCuratedPromoFilterOptions(fixturePromos, EMPTY_CURATED_PROMO_FILTERS);
    const html = renderToStaticMarkup(
      createElement(CuratedPromoFilterChips, {
        filters: EMPTY_CURATED_PROMO_FILTERS,
        options,
        onFilterChange: () => {},
      }),
    );

    assert.match(html, /Places/);
    assert.match(html, /Venetian/);
    assert.match(html, /Offer types/);
  });

  it("renders Card from fixture DTO without overlap presentation", () => {
    const html = renderToStaticMarkup(
      createElement(CuratedPromoCard, {
        promo: fixturePromo,
        onOpen: () => {},
      }),
    );

    assert.match(html, /Spring free play bundle/);
    assert.match(html, /Venetian/);
    assert.equal(html.includes("Related events"), false);
  });

  it("renders Carousel cards from fixture DTOs", () => {
    const html = renderToStaticMarkup(
      createElement(CuratedPromoCarousel, {
        promos: fixturePromos,
        onOpenPromo: () => {},
      }),
    );

    assert.match(html, /Spring free play bundle/);
    assert.match(html, /Manual host offer note/);
    assert.match(html, /Upcoming pool party promo/);
  });

  it("renders DetailSheet source CTA without analytics wiring", () => {
    assert.ok(fixturePromo.sourceUrl);

    const html = renderToStaticMarkup(
      createElement(CuratedPromoDetailSheet, {
        promo: fixturePromo,
        onClose: () => {},
      }),
    );

    assert.match(html, /View source/);
    assert.match(html, /https:\/\/example.com\/venetian-promo/);
    assert.match(html, /noopener noreferrer/);
    assert.equal(html.includes("Related events"), false);
    assert.equal(html.includes("/api/log-click"), false);
  });

  it("omits source CTA when fixture DTO has no sourceUrl", () => {
    const withoutSource = fixturePromos.find((promo) => !promo.sourceUrl);
    assert.ok(withoutSource);

    const html = renderToStaticMarkup(
      createElement(CuratedPromoDetailSheet, {
        promo: withoutSource,
        onClose: () => {},
      }),
    );

    assert.equal(html.includes("View source"), false);
  });

  it("renders the full discovery widget tree from fixtures", () => {
    const html = renderToStaticMarkup(
      createElement(CuratedPromoDiscoveryWidget, {
        promos: fixturePromos,
      }),
    );

    assert.match(html, /Curated promos/);
    assert.match(html, /Filter by place or offer type/);
    assert.match(html, /Places/);
    assert.match(html, /Spring free play bundle/);
    assert.match(html, /Manual host offer note/);
    assert.equal(html.includes("Related events"), false);
  });

  it("renders widget empty state when no promos are provided", () => {
    const html = renderToStaticMarkup(
      createElement(CuratedPromoDiscoveryWidget, {
        promos: [],
      }),
    );

    assert.match(html, /No curated promos published yet/);
  });

  it("keeps excluded tracker, overlap, and dashboard imports out of S3-D files", () => {
    for (const relative of composedFiles) {
      const source = readFileSync(join(srcRoot, relative), "utf8");
      for (const token of forbidden) {
        assert.equal(
          source.includes(token),
          false,
          `${relative} must not contain ${token}`,
        );
      }
    }
  });
});
