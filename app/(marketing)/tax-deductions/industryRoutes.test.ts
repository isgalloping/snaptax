import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Metadata } from "next";
import React from "react";
import ElectricianTaxDeductionsPage, {
  metadata as electricianMetadata,
} from "./electrician/page";
import HvacTaxDeductionsPage, { metadata as hvacMetadata } from "./hvac/page";
import LandscaperTaxDeductionsPage, {
  metadata as landscaperMetadata,
} from "./landscaper/page";
import PlumberTaxDeductionsPage, {
  metadata as plumberMetadata,
} from "./plumber/page";
import RooferTaxDeductionsPage, {
  metadata as rooferMetadata,
} from "./roofer/page";
import { JsonLd } from "@/components/marketing/JsonLd";
import { IndustrySeoPageView } from "@/components/marketing/seo/IndustrySeoPage";
import {
  getIndustryBySlug,
  listPublishedIndustries,
} from "@/lib/marketing/seo/industries";
import { buildIndustryJsonLd } from "@/lib/marketing/seo/jsonLd";
import type {
  IndustrySeoPage,
  IndustrySlug,
} from "@/lib/marketing/seo/types";

type IndustryRoute = {
  slug: IndustrySlug;
  Component: () => React.ReactNode;
  metadata: Metadata;
};

const INDUSTRY_ROUTES: readonly IndustryRoute[] = [
  {
    slug: "electrician",
    Component: ElectricianTaxDeductionsPage,
    metadata: electricianMetadata,
  },
  { slug: "hvac", Component: HvacTaxDeductionsPage, metadata: hvacMetadata },
  {
    slug: "plumber",
    Component: PlumberTaxDeductionsPage,
    metadata: plumberMetadata,
  },
  { slug: "roofer", Component: RooferTaxDeductionsPage, metadata: rooferMetadata },
  {
    slug: "landscaper",
    Component: LandscaperTaxDeductionsPage,
    metadata: landscaperMetadata,
  },
];

function findElementByType<Props>(
  node: React.ReactNode,
  type: React.ElementType,
): React.ReactElement<Props> | undefined {
  if (!React.isValidElement(node)) return undefined;
  if (node.type === type) return node as React.ReactElement<Props>;

  const children = (node.props as { children?: React.ReactNode }).children;
  for (const child of React.Children.toArray(children)) {
    const match = findElementByType<Props>(child, type);
    if (match) return match;
  }
  return undefined;
}

function absoluteTitle(metadata: Metadata): string {
  const { title } = metadata;
  assert.ok(title && typeof title === "object" && "absolute" in title);
  return String(title.absolute);
}

function firstOpenGraphImage(metadata: Metadata): { url: string; alt: string } {
  const images = metadata.openGraph?.images;
  assert.ok(Array.isArray(images));
  const [image] = images;
  assert.ok(image && typeof image === "object" && "url" in image);
  assert.ok("alt" in image);
  return {
    url: String(image.url),
    alt: String(image.alt),
  };
}

describe("tax deduction industry routes", () => {
  it("has one route module for every published industry", () => {
    assert.deepEqual(
      INDUSTRY_ROUTES.map((route) => route.slug),
      listPublishedIndustries().map((page) => page.slug),
    );
  });

  for (const route of INDUSTRY_ROUTES) {
    it(`${route.slug} route renders registry page data and matching SEO metadata`, () => {
      const page = getIndustryBySlug(route.slug);
      assert.ok(page);

      const tree = route.Component();
      const view = findElementByType<{ page: IndustrySeoPage }>(
        tree,
        IndustrySeoPageView,
      );
      const jsonLd = findElementByType<{ data: Record<string, unknown> }>(
        tree,
        JsonLd,
      );

      assert.equal(view?.props.page, page);
      assert.deepEqual(jsonLd?.props.data, buildIndustryJsonLd(page));
      assert.equal(absoluteTitle(route.metadata), page.seo.title);
      assert.equal(route.metadata.description, page.seo.description);
      assert.ok(
        String(route.metadata.alternates?.canonical).endsWith(page.path),
      );
      const ogImage = firstOpenGraphImage(route.metadata);
      assert.ok(ogImage.url.endsWith(page.hero.ogImage.src));
      assert.equal(ogImage.alt, page.hero.ogImage.alt);
    });
  }
});
