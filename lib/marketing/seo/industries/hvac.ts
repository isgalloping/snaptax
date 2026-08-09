
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";

export const HVAC_SEO_PAGE: IndustrySeoPage = {
  slug: "hvac",
  presentation: "mockup",
  path: "/tax-deductions/hvac",
  label: "HVAC",
  indexBlurb:
    "Common tax deductions for tools, refrigerants, service trucks, and job supplies.",
  seo: {
    title: "HVAC Tax Deductions: Expense Guide for Contractors | SnapTax",
    description:
      "Explore common HVAC tax deductions and learn how to track tools, supplies, vehicle costs, certifications, and receipts with SnapTax.",
  },
  hero: {
    h1: "HVAC tax deductions, organized.",
    subtitle: "Built for HVAC Technicians & Contractors",
    body: "Track receipts, organize HVAC business expenses, and prepare tax-ready reports without digging through your truck at tax time.",
    primaryCta: "Track HVAC Expenses",
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
      src: "/marketing/seo/hvac-tax-deductions-snaptax.png",
      alt: "HVAC technician working on an outdoor air conditioning unit",
    },
    phoneImage: {
      src: "/marketing/seo/hvac-tax-deductions-snaptax-phone.png",
      alt: "SnapTax app showing HVAC supplier receipts and tax saved",
    },
    ogImage: {
      src: "/marketing/seo/hvac-tax-deductions-snaptax-og.jpg",
      alt: "HVAC tax deductions and expense tracking with SnapTax",
    },
    highlights: [
      {
        title: "Built for HVAC work",
        body: "Designed for how technicians actually work between jobs and in the service truck.",
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
  deductionsTitle: "Common HVAC Tax Deductions",
  deductionsIntro:
    "A business expense may be deductible when it is ordinary and necessary for your work. Eligibility depends on how the expense was used and your individual tax situation.",
  deductionCards: [
    {
      title: "Tools & Equipment",
      body: "Specialized tools used on HVAC jobs.",
      examples: ["Gauges", "Meters", "Drills", "Vacuum pumps"],
    },
    {
      title: "Parts & Supplies",
      body: "Job parts and consumables purchased for installs and repairs.",
      examples: ["Filters", "Capacitors", "Fittings", "Wiring"],
    },
    {
      title: "Refrigerants & Chemicals",
      body: "Refrigerant and related service chemicals for HVAC work.",
      examples: ["Refrigerant", "Cleaners", "Leak detection"],
    },
    {
      title: "Safety Gear",
      body: "Protective equipment required for field work.",
      examples: ["Gloves", "Goggles", "Respirators"],
    },
    {
      title: "Vehicle Expenses",
      body: "Business vehicle costs between job sites and suppliers.",
      examples: ["Fuel", "Tolls", "Eligible service-truck costs"],
    },
    {
      title: "Training & Certifications",
      body: "Training that supports your HVAC trade.",
      examples: ["EPA 608", "Code training", "Safety training"],
    },
    {
      title: "Licenses & Permits",
      body: "License renewals and local permit fees.",
      examples: ["Contractor licenses", "Local permits"],
    },
    {
      title: "Software & Services",
      body: "Tools you use to run the HVAC business.",
      examples: ["Scheduling", "Invoicing", "Cloud storage"],
    },
  ],
  problemsTitle: "HVAC receipts are easy to lose",
  problems: [
    {
      title: "Receipts disappear",
      body: "Supply-house and hardware-store receipts can fade, tear, or get lost in a service truck.",
      solution: "Snap the receipt before it leaves your hand.",
    },
    {
      title: "Expenses get mixed together",
      body: "Tools, parts, fuel, uniforms, and personal purchases often appear on the same card or account.",
      solution: "Categorize each purchase while the job is still fresh.",
    },
    {
      title: "Tax-time cleanup takes hours",
      body: "Waiting until tax season means searching through bank statements, emails, glove boxes, and tool bags.",
      solution: "Keep a running digital record all year.",
    },
  ],
  problemsClosing:
    "SnapTax keeps every HVAC receipt organized and ready for tax time.",
  howItWorks: {
    id: "how-it-works",
    title: "How SnapTax Works for HVAC",
    steps: [
      {
        title: "Capture Receipts",
        body: "Snap supplier, fuel, tool, and parts receipts as you work.",
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
      src: "/marketing/seo/hvac-tax-deductions-snaptax-steps.png",
      alt: "SnapTax capture, review, and home screens for HVAC expenses",
    },
  },
  examplesTitle: "Example HVAC expenses",
  examplesCategoryHeader: "Category",
  examples: [],
  productCategoryNote:
    "SnapTax organizes expenses using Tools, Truck Gas, Supplies, Equipment, Materials, and Other — the same categories used in US exports.",
  checklist: {
    title: "HVAC Expense Recordkeeping Checklist",
    items: [
      "Photograph every business receipt",
      "Separate personal and business expenses",
      "Record merchant, date, and amount",
      "Add the customer, project, or job",
      "Keep mileage records separately",
      "Save license and certification records",
      "Save EPA 608 and training receipts",
      "Review Needs Action items",
      "Export your annual report",
    ],
  },
  builtFor: {
    title: "Built for HVAC Contractors",
    body: "Receipt capture and expense organization for independent HVAC technicians — not a full accounting suite and not a tax-filing product.",
    features: [
      {
        title: "AI Receipt Scanner",
        body: "Extracts the merchant, date, amount, and other receipt details.",
      },
      {
        title: "Expense categories",
        body: "Helps organize tools, parts, refrigerants, vehicle costs, training, and supplies.",
      },
      {
        title: "Tax Reports",
        body: "Exports clean expense reports for your records or tax professional.",
      },
      {
        title: "Offline Mode",
        body: "Capture receipts on the job and sync when connectivity returns.",
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
      { href: "/tax-deductions/plumber", label: "Plumber Tax Deductions" },
      { href: "/tax-deductions/roofer", label: "Roofer Tax Deductions" },
      { href: "/tax-deductions/landscaper", label: "Landscaper Tax Deductions" },
    ],
  },
  faq: [
    {
      question: "What can HVAC technicians deduct on their taxes?",
      answer:
        "Potential business expenses may include qualifying tools, equipment, parts, supplies, safety gear, licenses, training, insurance, business vehicle costs, software, advertising, and professional services. Deductibility depends on the nature of the expense, its business use, and your circumstances.",
    },
    {
      question: "Can HVAC tools be written off?",
      answer:
        "Tools purchased for HVAC work may qualify as business expenses. Tax treatment can depend on cost, useful life, and business-use percentage.",
    },
    {
      question: "Can I deduct my HVAC service truck expenses?",
      answer:
        "Business vehicle expenses may be deductible, but personal commuting and business travel must be distinguished. Keep records that support the business use of the vehicle.",
    },
    {
      question: "Can I deduct EPA 608 certification costs?",
      answer:
        "Certification, renewal, and training expenses related to skills used in an existing HVAC business may qualify, depending on the circumstances.",
    },
    {
      question: "Do I need to keep every HVAC receipt?",
      answer:
        "Keeping receipts and supporting records helps document the amount, date, vendor, and business purpose of an expense. Additional records may be needed for vehicle, equipment, and mixed-use expenses.",
    },
    {
      question: "Can I give my SnapTax report to my accountant?",
      answer:
        "Yes. You can export an organized expense report and use it when reviewing your records with an accountant or tax preparer.",
    },
    {
      question: "Does SnapTax track mileage?",
      answer:
        "SnapTax can help organize vehicle-related receipts, but it does not currently replace a complete mileage log. Keep a separate record of the date, destination, distance, and business purpose of each trip.",
    },
  ],
  finalCta: {
    title: "Stop letting HVAC receipts disappear in your truck",
    body: "Capture each receipt when you get it, organize the expense, and build a cleaner record for tax season.",
    button: "Start Tracking Expenses",
    noCardRequired: "No credit card required to start.",
    backgroundImage: {
      src: "/marketing/seo/hvac-tax-deductions-snaptax-cta.webp",
      alt: "",
    },
  },
  outboundLinks: [
    { href: "/features", label: "SnapTax features" },
    { href: "/faq", label: "FAQ" },
    {
      href: "/tax-deductions/electrician",
      label: "Electrician tax deductions",
    },
    {
      href: "/tax-deductions/plumber",
      label: "Plumber tax deductions",
    },
    {
      href: "/tax-deductions/roofer",
      label: "Roofer tax deductions",
    },
    {
      href: "/tax-deductions/landscaper",
      label: "Landscaper tax deductions",
    },
    {
      href: "/blog/how-to-organize-receipts",
      label: "How to organize receipts",
    },
    {
      href: "/blog/1099-contractor-tax-guide",
      label: "1099 contractor tax guide",
    },
  ],
  disclaimer:
    "For educational purposes only. Not tax advice. Confirm deductions with a qualified professional. See our disclaimer for details.",
};
