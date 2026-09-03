import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { curatedPromoDiscoveryViewRows } from "../__fixtures__/curatedPromoDiscoveryRow.fixtures";
import { mapCuratedPromoDiscoveryRow } from "../mappers/curatedPromoDiscoveryMapper";
import CuratedPromoEmptyState from "../../components/v2/curated-promos/CuratedPromoEmptyState";
import CuratedPromoEvidenceBlock from "../../components/v2/curated-promos/CuratedPromoEvidenceBlock";
import CuratedPromoSignalList from "../../components/v2/curated-promos/CuratedPromoSignalList";

const fixturePromo = mapCuratedPromoDiscoveryRow(curatedPromoDiscoveryViewRows[0]);

describe("S3-C leaf curated presentation", () => {
  it("renders EmptyState default message and clear-filters control", () => {
    let cleared = false;
    const html = renderToStaticMarkup(
      createElement(CuratedPromoEmptyState, {
        onClearFilters: () => {
          cleared = true;
        },
      }),
    );

    assert.match(html, /No promos match your filters\./);
    assert.match(html, /Clear all filters/);
    assert.equal(cleared, false);
  });

  it("renders EmptyState custom message without clear control", () => {
    const html = renderToStaticMarkup(
      createElement(CuratedPromoEmptyState, {
        message: "Nothing curated yet.",
      }),
    );

    assert.match(html, /Nothing curated yet\./);
    assert.equal(html.includes("Clear all filters"), false);
  });

  it("renders EvidenceBlock from mapped fixture DTO evidence", () => {
    assert.ok(fixturePromo.evidence.length > 0);

    const html = renderToStaticMarkup(
      createElement(CuratedPromoEvidenceBlock, {
        evidence: fixturePromo.evidence,
      }),
    );

    assert.match(html, /Source evidence/);
    assert.match(html, /Daily Dining Credit/);
  });

  it("returns null markup when EvidenceBlock has no items", () => {
    const html = renderToStaticMarkup(
      createElement(CuratedPromoEvidenceBlock, { evidence: [] }),
    );
    assert.equal(html, "");
  });

  it("renders SignalList grouped labels from mapped fixture DTO signals", () => {
    assert.ok(fixturePromo.signals.length > 0);

    const html = renderToStaticMarkup(
      createElement(CuratedPromoSignalList, {
        signals: fixturePromo.signals,
      }),
    );

    assert.match(html, /Match Play|match play|\$50/i);
    assert.equal(html.includes("No signals parsed"), false);
  });

  it("renders SignalList empty copy when signals are absent", () => {
    const html = renderToStaticMarkup(
      createElement(CuratedPromoSignalList, { signals: [] }),
    );
    assert.match(html, /No signals parsed for this promo yet\./);
  });
});
