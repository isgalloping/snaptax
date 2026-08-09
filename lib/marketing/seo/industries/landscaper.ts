import type { IndustrySeoPage } from "@/lib/marketing/seo/types";

export const LANDSCAPER_SEO_PAGE: IndustrySeoPage = {
  slug: "landscaper",
  presentation: "mockup",
  path: "/tax-deductions/landscaper",
  label: "Landscaper",
  indexBlurb:
    "Common tax deductions for plants, equipment, fuel, repairs, trailers, and dump fees.",
  seo: {
    title: "Landscaper Tax Deductions: Expense Guide | SnapTax",
    description:
      "Explore common landscaper tax deductions and learn how to track plants, equipment, fuel, repairs, vehicle costs, rentals, and business receipts.",
  },
  hero: {
    h1: "Landscaping tax deductions, organized.",
    subtitle: "Built for Landscapers & Lawn Care Contractors",
    body: "Track receipts, organize landscaping business expenses, and prepare tax-ready reports without digging through your work truck at tax time.",
    primaryCta: "Track Landscaping Expenses",
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
      src: "/marketing/seo/landscaper-tax-deductions-snaptax.png",
      alt: "Landscaper operating a commercial mower in a residential yard",
    },
    phoneImage: {
      src: "/marketing/seo/landscaper-tax-deductions-snaptax-phone.png",
      alt: "SnapTax app showing landscaping supplier receipts and tax saved",
    },
    ogImage: {
      src: "/marketing/seo/landscaper-tax-deductions-snaptax-og.jpg",
      alt: "Landscaper tax deductions and expense tracking with SnapTax",
    },
    highlights: [
      {
        title: "Built for outdoor work",
        body: "Designed for how landscapers actually work between jobs and in the truck.",
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
  deductionsTitle: "Common Landscaper Tax Deductions",
  deductionsIntro:
    "A landscaping business expense may be deductible when it is ordinary and necessary for the work. Eligibility depends on how the expense was used and your individual tax situation.",
  deductionCards: [
    {
      title: "Plants & Materials",
      body: "Materials purchased for customer landscape jobs.",
      examples: ["Plants", "Trees", "Soil", "Mulch"],
    },
    {
      title: "Tools & Equipment",
      body: "Power and hand tools used on landscaping jobs.",
      examples: ["Mowers", "Trimmers", "Blowers", "Hand tools"],
    },
    {
      title: "Fuel & Lubricants",
      body: "Fuel and fluids for landscaping equipment.",
      examples: ["Gasoline", "Mixed fuel", "Oil"],
    },
    {
      title: "Repairs & Maintenance",
      body: "Parts and service that keep equipment running.",
      examples: ["Blades", "Belts", "Filters", "Repairs"],
    },
    {
      title: "Vehicle & Trailer",
      body: "Eligible costs of trucks and trailers for the business.",
      examples: ["Fuel", "Maintenance", "Registration", "Tolls"],
    },
    {
      title: "Safety Gear",
      body: "Protective gear for outdoor landscaping work.",
      examples: ["Gloves", "Goggles", "Hearing protection"],
    },
    {
      title: "Equipment Rental",
      body: "Short-term gear rented for landscaping projects.",
      examples: ["Loaders", "Trenchers", "Aerators"],
    },
    {
      title: "Dump & Disposal Fees",
      body: "Green waste and debris disposal costs.",
      examples: ["Green waste", "Debris hauling", "Dump fees"],
    },
  ],
  problemsTitle: "Landscaping receipts are easy to lose",
  problems: [
    {
      title: "Receipts disappear",
      body: "Nursery and supply-house receipts fade, get wet, or disappear into a work truck.",
      solution: "Snap the receipt before you leave the supplier.",
    },
    {
      title: "Expenses get mixed together",
      body: "Plants, fuel, repairs, rentals, and personal purchases often appear on the same card.",
      solution: "Categorize each purchase while the job is still fresh.",
    },
    {
      title: "Tax-time cleanup takes hours",
      body: "Waiting until tax season means searching through statements, emails, trucks, and job folders.",
      solution: "Keep a running digital record all year.",
    },
  ],
  problemsClosing:
    "SnapTax keeps every landscaping receipt organized and ready for tax time.",
  howItWorks: {
    id: "how-it-works",
    title: "How SnapTax Works for Landscapers",
    steps: [
      {
        title: "Capture Receipts",
        body: "Snap plant, fuel, tool, rental, and dump-fee receipts as you work.",
      },
      {
        title: "Review the Result",
        body: "Check the merchant, amount, and category — using Tools, Supplies, Truck Gas, Equipment, Materials, and Other — plus the Schedule C line when shown.",
      },
      {
        title: "Organize & Export",
        body: "Review ready items and create a tax-ready expense report for your records or tax professional.",
      },
    ],
    stepsBanner: {
      src: "/marketing/seo/landscaper-tax-deductions-snaptax-steps.png",
      alt: "SnapTax capture, review, and home screens for landscaping expenses",
    },
  },
  examplesTitle: "Example landscaping expenses",
  examplesCategoryHeader: "Category",
  examples: [],
  productCategoryNote:
    "SnapTax organizes expenses using Tools, Truck Gas, Supplies, Equipment, Materials, and Other — the same categories used in US exports.",
  checklist: {
    title: "Landscaping Expense Recordkeeping Checklist",
    items: [
      "Photograph every business receipt",
      "Separate personal and business expenses",
      "Record merchant, date, and amount",
      "Add the customer, project, or job",
      "Keep mileage records separately",
      "Save equipment repair records",
      "Save dump and disposal receipts",
      "Review Needs Action items",
      "Export your annual report",
    ],
  },
  builtFor: {
    title: "Built for Landscaping Contractors",
    body: "Receipt capture and expense organization for independent landscapers — not a full accounting suite and not a tax-filing product.",
    features: [
      {
        title: "AI Receipt Scanner",
        body: "Extracts the merchant, date, amount, and other receipt details.",
      },
      {
        title: "Expense categories",
        body: "Helps organize materials, fuel, equipment, repairs, rentals, and disposal expenses.",
      },
      {
        title: "Tax Reports",
        body: "Exports clean expense reports for your records or tax professional.",
      },
      {
        title: "Offline Mode",
        body: "Capture receipts outdoors and sync when connectivity returns.",
      },
      {
        title: "Secure & Private",
        body: "Helps protect sensitive receipt and business expense information.",
      },
    ],
  },
  relatedTrades: {
    title: "Tax deductions for other trades",
    links: [
      { href: "/tax-deductions/electrician", label: "Electrician Tax Deductions" },
      { href: "/tax-deductions/hvac", label: "HVAC Tax Deductions" },
      { href: "/tax-deductions/plumber", label: "Plumber Tax Deductions" },
      { href: "/tax-deductions/roofer", label: "Roofer Tax Deductions" },
    ],
  },
  faq: [
    {
      question: "What can landscapers deduct on their taxes?",
      answer:
        "Potential business expenses may include qualifying plants, materials, tools, equipment, fuel, repairs, vehicle costs, rentals, safety gear, licenses, insurance, disposal fees, advertising, and professional services. Eligibility depends on the nature and business use of each expense.",
    },
    {
      question: "Can landscapers write off equipment?",
      answer:
        "Equipment purchased for landscaping work may qualify as a business expense. Tax treatment may depend on its cost, expected useful life, and business-use percentage.",
    },
    {
      question: "Can I deduct mower and equipment fuel?",
      answer:
        "Fuel and operating fluids used for landscaping equipment may qualify as business expenses when properly documented and separated from personal use.",
    },
    {
      question: "Can landscaping materials be deducted?",
      answer:
        "Plants, trees, soil, mulch, gravel, irrigation parts, and other materials purchased for customer projects may qualify when supported by appropriate records.",
    },
    {
      question: "Can I deduct my landscaping truck and trailer?",
      answer:
        "Eligible business vehicle and trailer expenses may be deductible, but personal commuting and business travel must be distinguished. Keep records supporting the vehicle’s business use.",
    },
    {
      question: "Can landscapers deduct equipment repairs?",
      answer:
        "Routine servicing, replacement parts, blade sharpening, and qualifying equipment repairs may be business expenses when related to landscaping work.",
    },
    {
      question: "Does SnapTax track mileage?",
      answer:
        "SnapTax can organize vehicle-related receipts, but it does not currently replace a complete mileage log. Keep separate records of each trip’s date, destination, distance, and business purpose.",
    },
  ],
  finalCta: {
    title: "Stop letting landscaping receipts disappear in your truck",
    body: "Capture receipts as you work, organize landscaping expenses, and prepare a cleaner record for tax season.",
    button: "Start Tracking Expenses",
    noCardRequired: "No credit card required to start.",
    backgroundImage: {
      src: "/marketing/seo/landscaper-tax-deductions-snaptax-cta.webp",
      alt: "",
    },
  },
  outboundLinks: [
    { href: "/features", label: "SnapTax features" },
    { href: "/faq", label: "FAQ" },
    { href: "/tax-deductions/electrician", label: "Electrician tax deductions" },
    { href: "/tax-deductions/hvac", label: "HVAC tax deductions" },
    { href: "/tax-deductions/plumber", label: "Plumber tax deductions" },
    { href: "/tax-deductions/roofer", label: "Roofer tax deductions" },
    {
      href: "/blog/how-to-organize-receipts",
      label: "How to organize receipts",
    },
  ],
  disclaimer:
    "For educational purposes only. Not tax advice. Confirm deductions with a qualified professional. See our disclaimer for details.",
};
