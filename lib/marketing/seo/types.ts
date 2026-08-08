export type IndustrySlug = "electrician";

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
    trustItems: string[];
    workerImage: { src: string; alt: string };
    /** Social / Open Graph image (optimized, typically 1200×630). */
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
  /** Column header for examples table — must not imply fake App labels. */
  examplesCategoryHeader: string;
  examples: { expense: string; category: string }[];
  productCategoryNote: string;
  builtFor: {
    title: string;
    body: string;
    features: { title: string; body: string }[];
  };
  faq: { question: string; answer: string }[];
  finalCta: {
    title: string;
    body: string;
    button: string;
    noCardRequired: string;
  };
  outboundLinks: { href: string; label: string }[];
  disclaimer: string;
};
