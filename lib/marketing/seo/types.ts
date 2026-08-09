export type IndustrySlug = "electrician" | "hvac";

export type IndustrySeoPage = {
  slug: IndustrySlug;
  path: `/tax-deductions/${IndustrySlug}`;
  label: string;
  indexBlurb: string;
  seo: { title: string; description: string };
  hero: {
    h1: string;
    subtitle: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    /** In-page hash or path for secondary CTA (e.g. "#deductions"). */
    secondaryHref: string;
    trustItems: string[];
    workerImage: { src: string; alt: string };
    phoneImage?: { src: string; alt: string };
    /**
     * stacked (default when omitted): worker + phone side-by-side.
     * composite: full-width phoneImage with workerImage as corner overlay.
     */
    visualLayout?: "stacked" | "composite";
    ogImage: { src: string; alt: string };
  };
  deductionsTitle: string;
  deductionsIntro: string;
  deductionCards: { title: string; body: string; examples: string[] }[];
  problemsTitle: string;
  problems: { title: string; body: string; solution: string }[];
  howItWorks: {
    id: "how-it-works";
    title: string;
    steps: { title: string; body: string }[];
  };
  examplesTitle: string;
  examplesCategoryHeader: string;
  examples: { expense: string; category: string }[];
  productCategoryNote: string;
  checklist?: { title: string; items: string[] };
  builtFor: {
    title: string;
    body: string;
    features: { title: string; body: string }[];
  };
  relatedTrades?: {
    title: string;
    links: { href: string; label: string }[];
  };
  faq: { question: string; answer: string }[];
  finalCta: {
    title: string;
    body: string;
    button: string;
    noCardRequired: string;
    backgroundImage?: { src: string; alt: string };
  };
  outboundLinks: { href: string; label: string }[];
  disclaimer: string;
};
