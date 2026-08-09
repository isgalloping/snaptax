import type { IndustrySeoPage } from "@/lib/marketing/seo/types";

export const ROOFER_SEO_PAGE: IndustrySeoPage = {
  slug: "roofer",
  presentation: "mockup",
  path: "/tax-deductions/roofer",
  label: "Roofer",
  indexBlurb:
    "Common tax deductions for roofing materials, tools, safety gear, rentals, and dump fees.",
  seo: {
    title: "Roofer Tax Deductions: Expense Guide for Contractors | SnapTax",
    description:
      "Explore common roofer tax deductions and learn how to track roofing materials, tools, vehicle costs, equipment rentals, dump fees, and receipts.",
  },
  hero: {
    h1: "Roofing tax deductions, organized.",
    subtitle: "Built for Roofers & Roofing Contractors",
    body: "Track receipts, organize roofing business expenses, and prepare tax-ready reports without digging through your work truck at tax time.",
    primaryCta: "Track Roofing Expenses",
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
      src: "/marketing/seo/roofer-tax-deductions-snaptax.png",
      alt: "Roofer in a safety harness installing shingles on a residential roof",
    },
    phoneImage: {
      src: "/marketing/seo/roofer-tax-deductions-snaptax-phone.png",
      alt: "SnapTax app showing roofing supplier receipts and tax saved",
    },
    ogImage: {
      src: "/marketing/seo/roofer-tax-deductions-snaptax-og.jpg",
      alt: "Roofer tax deductions and expense tracking with SnapTax",
    },
    highlights: [
      {
        title: "Built for roofing work",
        body: "Designed for how roofers actually work on roofs and in the truck.",
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
  deductionsTitle: "Common Roofer Tax Deductions",
  deductionsIntro:
    "A roofing business expense may be deductible when it is ordinary and necessary for the work. Eligibility depends on how the expense was used and your individual tax situation.",
  deductionCards: [
    {
      title: "Roofing Materials",
      body: "Materials purchased for roof installs and repairs.",
      examples: ["Shingles", "Underlayment", "Flashing", "Sealants"],
    },
    {
      title: "Tools & Equipment",
      body: "Tools used on roofing jobs.",
      examples: ["Nail guns", "Compressors", "Saws", "Hand tools"],
    },
    {
      title: "Safety Equipment",
      body: "Fall protection and protective gear for roof work.",
      examples: ["Harnesses", "Anchors", "Helmets", "Gloves"],
    },
    {
      title: "Ladders & Scaffolding",
      body: "Access equipment for roofs and elevations.",
      examples: ["Ladders", "Platforms", "Scaffolding", "Temporary access"],
    },
    {
      title: "Vehicle Expenses",
      body: "Eligible costs of getting to jobs and suppliers.",
      examples: ["Fuel", "Tolls", "Parking", "Truck costs"],
    },
    {
      title: "Equipment Rental",
      body: "Short-term gear rented for roofing projects.",
      examples: ["Lifts", "Trailers", "Compressors", "Dumpsters"],
    },
    {
      title: "Dump & Disposal Fees",
      body: "Debris and landfill costs from roof work.",
      examples: ["Landfill fees", "Hauling", "Transfer station"],
    },
    {
      title: "Licenses & Permits",
      body: "Credentials and fees for roofing work.",
      examples: ["Contractor licenses", "Local permits", "Inspection fees"],
    },
  ],
  problemsTitle: "Roofing receipts are easy to lose",
  problems: [
    {
      title: "Receipts disappear",
      body: "Supply-house receipts fade, tear, get wet, or disappear into a work truck.",
      solution: "Snap the receipt before you leave the supplier.",
    },
    {
      title: "Expenses get mixed together",
      body: "Materials, tools, fuel, rentals, and personal purchases often appear on the same card.",
      solution: "Categorize each purchase while the job is still fresh.",
    },
    {
      title: "Tax-time cleanup takes hours",
      body: "Waiting until tax season means searching through statements, emails, trucks, and job folders.",
      solution: "Keep a running digital record all year.",
    },
  ],
  problemsClosing:
    "SnapTax keeps every roofing receipt organized and ready for tax time.",
  howItWorks: {
    id: "how-it-works",
    title: "How SnapTax Works for Roofers",
    steps: [
      {
        title: "Capture Receipts",
        body: "Snap material, fuel, tool, rental, and dump-fee receipts as you work.",
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
      src: "/marketing/seo/roofer-tax-deductions-snaptax-steps.png",
      alt: "SnapTax capture, review, and home screens for roofing expenses",
    },
  },
  examplesTitle: "Example roofing expenses",
  examplesCategoryHeader: "Category",
  examples: [],
  productCategoryNote:
    "SnapTax organizes expenses using Tools, Truck Gas, Supplies, Equipment, Materials, and Other — the same categories used in US exports.",
  checklist: {
    title: "Roofing Expense Recordkeeping Checklist",
    items: [
      "Photograph every business receipt",
      "Separate personal and business expenses",
      "Record merchant, date, and amount",
      "Add the customer, project, or job",
      "Keep mileage records separately",
      "Save equipment rental agreements",
      "Save dump and disposal receipts",
      "Review Needs Action items",
      "Export your annual report",
    ],
  },
  builtFor: {
    title: "Built for Roofing Contractors",
    body: "Receipt capture and expense organization for independent roofers — not a full accounting suite and not a tax-filing product.",
    features: [
      {
        title: "AI Receipt Scanner",
        body: "Extracts the merchant, date, amount, and other receipt details.",
      },
      {
        title: "Expense categories",
        body: "Helps organize materials, tools, rentals, vehicles, and disposal expenses.",
      },
      {
        title: "Tax Reports",
        body: "Exports clean expense reports for your records or tax professional.",
      },
      {
        title: "Offline Mode",
        body: "Capture expenses from job sites and sync when connectivity returns.",
      },
      {
        title: "Secure & Private",
        body: "Helps protect sensitive receipt and expense information.",
      },
    ],
  },
  relatedTrades: {
    title: "Tax deductions for other trades",
    links: [
      { href: "/tax-deductions/electrician", label: "Electrician Tax Deductions" },
      { href: "/tax-deductions/hvac", label: "HVAC Tax Deductions" },
      { href: "/tax-deductions/plumber", label: "Plumber Tax Deductions" },
      { href: "/tax-deductions/landscaper", label: "Landscaper Tax Deductions" },
    ],
  },
  faq: [
    {
      question: "What can roofers deduct on their taxes?",
      answer:
        "Potential business expenses may include qualifying roofing materials, tools, safety equipment, vehicle costs, rentals, disposal fees, licenses, permits, insurance, software, advertising, and professional services. Eligibility depends on the nature and business use of each expense.",
    },
    {
      question: "Can roofers write off tools and equipment?",
      answer:
        "Tools and equipment purchased for roofing work may qualify as business expenses. The tax treatment can depend on the cost, expected useful life, and business-use percentage.",
    },
    {
      question: "Can roofing materials be deducted?",
      answer:
        "Shingles, underlayment, flashing, fasteners, sealants, membranes, and other materials purchased for roofing jobs may qualify as business expenses when properly documented.",
    },
    {
      question: "Can roofers deduct safety equipment?",
      answer:
        "Safety harnesses, anchors, helmets, gloves, eye protection, respirators, and other protective equipment required for roofing work may qualify, depending on the circumstances.",
    },
    {
      question: "Can I deduct my roofing work truck?",
      answer:
        "Eligible business vehicle expenses may be deductible, but personal commuting and business travel must be distinguished. Keep records supporting the vehicle’s business use.",
    },
    {
      question: "Can roofers deduct dump fees?",
      answer:
        "Dump, landfill, debris hauling, and related disposal fees paid for roofing projects may qualify as business expenses when supported by appropriate records.",
    },
    {
      question: "Does SnapTax track mileage?",
      answer:
        "SnapTax can organize vehicle-related receipts, but it does not currently replace a complete mileage log. Keep separate records of each trip’s date, destination, distance, and business purpose.",
    },
  ],
  finalCta: {
    title: "Stop letting roofing receipts disappear in your truck",
    body: "Capture receipts as you work, organize roofing expenses, and prepare a cleaner record for tax season.",
    button: "Start Tracking Expenses",
    noCardRequired: "No credit card required to start.",
    backgroundImage: {
      src: "/marketing/seo/roofer-tax-deductions-snaptax-cta.webp",
      alt: "",
    },
  },
  outboundLinks: [
    { href: "/features", label: "SnapTax features" },
    { href: "/faq", label: "FAQ" },
    { href: "/tax-deductions/electrician", label: "Electrician tax deductions" },
    { href: "/tax-deductions/hvac", label: "HVAC tax deductions" },
    { href: "/tax-deductions/plumber", label: "Plumber tax deductions" },
    { href: "/tax-deductions/landscaper", label: "Landscaper tax deductions" },
    {
      href: "/blog/how-to-organize-receipts",
      label: "How to organize receipts",
    },
  ],
  disclaimer:
    "For educational purposes only. Not tax advice. Confirm deductions with a qualified professional. See our disclaimer for details.",
};
