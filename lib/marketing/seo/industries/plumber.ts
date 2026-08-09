import type { IndustrySeoPage } from "@/lib/marketing/seo/types";

export const PLUMBER_SEO_PAGE: IndustrySeoPage = {
  slug: "plumber",
  presentation: "mockup",
  path: "/tax-deductions/plumber",
  label: "Plumber",
  indexBlurb:
    "Common tax deductions for tools, parts, drain equipment, and service-truck costs.",
  seo: {
    title: "Plumber Tax Deductions: Expense Guide for Contractors | SnapTax",
    description:
      "Explore common plumber tax deductions and learn how to track tools, supplies, vehicle costs, licenses, and receipts with SnapTax.",
  },
  hero: {
    h1: "Plumbing tax deductions, organized.",
    subtitle: "Built for Plumbers & Plumbing Contractors",
    body: "Track receipts, organize plumbing business expenses, and prepare tax-ready reports without digging through your service truck at tax time.",
    primaryCta: "Track Plumbing Expenses",
    secondaryCta: "View Deductions",
    secondaryHref: "#deductions",
    visualLayout: "spotlight",
    trustItems: [
      "AI receipt scanning",
      "Organize expenses by category",
      "Export tax reports",
      "Works offline",
    ],
    workerImage: {
      src: "/marketing/seo/plumber-tax-deductions-snaptax.png",
      alt: "Plumber using a pipe wrench on residential piping",
    },
    phoneImage: {
      src: "/marketing/seo/plumber-tax-deductions-snaptax-phone.png",
      alt: "SnapTax app showing plumbing supplier receipts and tax saved",
    },
    ogImage: {
      src: "/marketing/seo/plumber-tax-deductions-snaptax-og.jpg",
      alt: "Plumber tax deductions and expense tracking with SnapTax",
    },
    highlights: [
      {
        title: "Built for plumbing work",
        body: "Designed for how plumbers actually work on jobs and in the truck.",
      },
      {
        title: "Tax-ready reports",
        body: "Export organized expense reports when you need them.",
      },
      {
        title: "Secure & private",
        body: "Keep receipt and expense records protected on your device and in sync.",
      },
      {
        title: "One-time payment",
        body: "Pay once per tax season — no subscription required.",
      },
    ],
  },
  deductionsTitle: "Common Plumber Tax Deductions",
  deductionsIntro:
    "A business expense may be deductible when it is ordinary and necessary for your plumbing work. Eligibility depends on how the expense was used and your individual tax situation.",
  deductionCards: [
    {
      title: "Tools & Equipment",
      body: "Specialized tools used on plumbing jobs.",
      examples: ["Pipe wrenches", "Cutters", "Inspection cameras", "Torch kits"],
    },
    {
      title: "Parts & Supplies",
      body: "Materials purchased for installs and repairs.",
      examples: ["Pipes", "Fittings", "Valves", "Sealants"],
    },
    {
      title: "Drain Cleaning Equipment",
      body: "Equipment used to clear and inspect drains.",
      examples: ["Augers", "Snakes", "Jetting accessories", "Cameras"],
    },
    {
      title: "Safety Gear",
      body: "Protective gear required for plumbing work.",
      examples: ["Gloves", "Knee pads", "Safety glasses", "Respirators"],
    },
    {
      title: "Vehicle Expenses",
      body: "Eligible costs of getting to jobs and suppliers.",
      examples: ["Fuel", "Parking", "Tolls", "Repairs"],
    },
    {
      title: "Licenses & Permits",
      body: "Credentials and fees for plumbing work.",
      examples: ["Plumbing licenses", "Local permits", "Inspection fees"],
    },
    {
      title: "Training & Certifications",
      body: "Courses that keep your trade skills current.",
      examples: ["Code courses", "Safety training", "Trade continuing education"],
    },
    {
      title: "Software & Services",
      body: "Tools that help run a plumbing business.",
      examples: ["Scheduling", "Invoicing", "Cloud storage"],
    },
  ],
  problemsTitle: "Plumbing receipts are easy to lose",
  problems: [
    {
      title: "Receipts disappear",
      body: "Supply-house receipts fade, get wet, or disappear into a service truck.",
      solution: "Snap the receipt before you leave the counter.",
    },
    {
      title: "Expenses get mixed together",
      body: "Materials, tools, fuel, and personal purchases often appear on the same card.",
      solution: "Categorize each purchase while the job is still fresh.",
    },
    {
      title: "Tax-time cleanup takes hours",
      body: "Waiting until tax season means searching through statements, emails, and tool bags.",
      solution: "Keep a running digital record all year.",
    },
  ],
  problemsClosing:
    "SnapTax keeps every plumbing receipt organized and ready for tax time.",
  howItWorks: {
    id: "how-it-works",
    title: "How SnapTax Works for Plumbers",
    steps: [
      {
        title: "Capture Receipts",
        body: "Snap supplier, fuel, tool, and permit receipts as you work.",
      },
      {
        title: "Organize Expenses",
        body: "Review real categories like Tools, Supplies, Truck Gas, Equipment, Materials, and Other — and add a short job note when it helps.",
      },
      {
        title: "Export & File",
        body: "Create a tax-ready expense report for your records or tax professional.",
      },
    ],
    stepsBanner: {
      src: "/marketing/seo/plumber-tax-deductions-snaptax-steps.png",
      alt: "SnapTax capture, organize, and home screens for plumbing expenses",
    },
  },
  examplesTitle: "Example plumbing expenses",
  examplesCategoryHeader: "Category",
  examples: [],
  productCategoryNote:
    "SnapTax organizes expenses using Tools, Truck Gas, Supplies, Equipment, Materials, and Other — the same categories used in US exports.",
  checklist: {
    title: "Plumbing Expense Recordkeeping Checklist",
    items: [
      "Photograph every business receipt",
      "Separate personal and business expenses",
      "Record merchant, date, and amount",
      "Add the customer, job, or business purpose",
      "Keep mileage records separately",
      "Review Needs Action items",
      "Save license and permit records",
      "Export your annual report",
    ],
  },
  builtFor: {
    title: "Built for Plumbing Contractors",
    body: "Receipt capture and expense organization for independent plumbers — not a full accounting suite and not a tax-filing product.",
    features: [
      {
        title: "AI Receipt Scanner",
        body: "Extracts the merchant, date, amount, and other receipt details.",
      },
      {
        title: "Expense categories",
        body: "Helps organize tools, supplies, vehicle costs, licenses, and other business expenses.",
      },
      {
        title: "Tax Reports",
        body: "Exports clean expense reports for your records or tax professional.",
      },
      {
        title: "Offline Mode",
        body: "Works in basements, job sites, and low-connectivity environments.",
      },
      {
        title: "Secure & Private",
        body: "Helps protect sensitive receipt and expense records.",
      },
    ],
  },
  relatedTrades: {
    title: "Tax deductions for other trades",
    links: [
      { href: "/tax-deductions/electrician", label: "Electrician Tax Deductions" },
      { href: "/tax-deductions/hvac", label: "HVAC Tax Deductions" },
      { href: "/tax-deductions/roofer", label: "Roofer Tax Deductions" },
    ],
  },
  faq: [
    {
      question: "What can plumbers deduct on their taxes?",
      answer:
        "Potential business expenses may include qualifying tools, equipment, parts, supplies, safety gear, licenses, permits, training, vehicle expenses, software, and professional services. Eligibility depends on the nature and business use of each expense.",
    },
    {
      question: "Can plumbers write off tools?",
      answer:
        "Tools purchased for plumbing work may qualify as business expenses. The tax treatment can depend on the cost, useful life, and business-use percentage of the tool.",
    },
    {
      question: "Can plumbing materials be deducted?",
      answer:
        "Pipes, fittings, valves, connectors, sealants, repair parts, and other materials purchased for plumbing jobs may qualify as business expenses when properly documented.",
    },
    {
      question: "Can I deduct my plumbing service truck?",
      answer:
        "Eligible business vehicle expenses may be deductible, but personal commuting and business travel must be distinguished. Keep records supporting the business use of the vehicle.",
    },
    {
      question: "Can I deduct plumbing licenses and permits?",
      answer:
        "License renewals, eligible permits, professional fees, and continuing education related to an existing plumbing business may qualify, depending on the circumstances.",
    },
    {
      question: "Can I export reports for my accountant?",
      answer:
        "Yes. You can export an organized expense report and use it when reviewing your records with an accountant or tax preparer.",
    },
    {
      question: "Does SnapTax track mileage?",
      answer:
        "SnapTax can organize vehicle-related receipts, but it does not currently replace a complete mileage log. Keep separate records of each trip's date, destination, distance, and business purpose.",
    },
  ],
  finalCta: {
    title: "Stop letting plumbing receipts disappear in your truck",
    body: "Snap, organize, and export plumbing expenses in minutes. Stay ready for tax time, every time.",
    button: "Start Tracking Expenses",
    noCardRequired: "No credit card required to start.",
    backgroundImage: {
      src: "/marketing/seo/plumber-tax-deductions-snaptax-cta.webp",
      alt: "",
    },
  },
  outboundLinks: [
    { href: "/features", label: "SnapTax features" },
    { href: "/faq", label: "FAQ" },
    { href: "/tax-deductions/electrician", label: "Electrician tax deductions" },
    { href: "/tax-deductions/hvac", label: "HVAC tax deductions" },
    { href: "/tax-deductions/roofer", label: "Roofer tax deductions" },
    {
      href: "/blog/how-to-organize-receipts",
      label: "How to organize receipts",
    },
  ],
  disclaimer:
    "For educational purposes only. Not tax advice. Confirm deductions with a qualified professional. See our disclaimer for details.",
};
