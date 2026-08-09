import type { IndustrySeoPage } from "@/lib/marketing/seo/types";

export const HVAC_SEO_PAGE: IndustrySeoPage = {
  slug: "hvac",
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
    h1: "Tax Deductions for HVAC Technicians and Contractors",
    subtitle: "Built for HVAC Technicians & Contractors",
    body: "Track receipts, organize HVAC business expenses, and prepare tax-ready reports without digging through your truck at tax time.",
    primaryCta: "Track HVAC Expenses",
    secondaryCta: "View Deductions",
    secondaryHref: "#deductions",
    trustItems: [
      "No forced sign-up",
      "Receipt scanning",
      "Tax-ready reports",
      "Works offline",
    ],
    workerImage: {
      src: "/marketing/seo/hvac-tax-deductions-snaptax.png",
      alt: "HVAC technician working on an outdoor air conditioning unit",
    },
    phoneImage: {
      src: "/marketing/seo/hvac-tax-deductions-snaptax-mobile.png",
      alt: "SnapTax app showing HVAC supplier receipt tracking",
    },
    ogImage: {
      src: "/marketing/seo/hvac-tax-deductions-snaptax-og.jpg",
      alt: "HVAC tax deductions and expense tracking with SnapTax",
    },
  },
  deductionsTitle: "Common HVAC Tax Deductions",
  deductionsIntro:
    "A business expense may be deductible when it is ordinary and necessary for your work. Eligibility depends on how the expense was used and your individual tax situation.",
  deductionCards: [
    {
      title: "Tools & Equipment",
      body: "Specialized tools used on HVAC jobs.",
      examples: ["Gauges", "Drills", "Vacuum pumps", "Recovery machines"],
    },
    {
      title: "Parts & Supplies",
      body: "Job parts and consumables purchased for installs and repairs.",
      examples: ["Filters", "Capacitors", "Fittings", "Sealants"],
    },
    {
      title: "Refrigerants",
      body: "Refrigerant and related service chemicals for HVAC work.",
      examples: ["R-410A", "R-22", "R-32", "Coil cleaner"],
    },
    {
      title: "Safety Gear",
      body: "Protective equipment required for field work.",
      examples: ["Gloves", "Eye protection", "Respirators", "Hard hats"],
    },
    {
      title: "Vehicle Expenses",
      body: "Business vehicle costs between job sites and suppliers.",
      examples: ["Fuel", "Parking", "Tolls", "Eligible maintenance"],
    },
    {
      title: "Training & Certifications",
      body: "Training that supports your HVAC trade.",
      examples: ["EPA 608", "Safety courses", "Manufacturer training"],
    },
    {
      title: "Licenses & Permits",
      body: "License renewals and local permit fees.",
      examples: ["Contractor license", "Local permits", "Business fees"],
    },
    {
      title: "Software & Services",
      body: "Tools you use to run the HVAC business.",
      examples: ["Scheduling", "Invoicing", "Cloud storage"],
    },
  ],
  problemsTitle: "HVAC receipts are easy to lose—and expensive to forget",
  problems: [
    {
      title: "Receipts disappear",
      body: "Supply-house and hardware-store receipts can fade, tear, or get lost in a service truck.",
      solution: "Snap the receipt before it leaves your hand.",
    },
    {
      title: "Expenses get mixed together",
      body: "Tools, parts, fuel, uniforms, and personal purchases often appear on the same card or account.",
      solution: "Organize each receipt with a clear business purpose.",
    },
    {
      title: "Tax-time cleanup takes hours",
      body: "Waiting until tax season means searching through bank statements, emails, glove boxes, and tool bags.",
      solution: "Build a cleaner record throughout the year.",
    },
  ],
  howItWorks: {
    id: "how-it-works",
    title: "How SnapTax Works for HVAC",
    steps: [
      {
        title: "Capture Receipts",
        body: "Snap supplier, fuel, and tool receipts before they disappear.",
      },
      {
        title: "Organize Expenses",
        body: "Review details and organize into useful categories such as Tools, Truck Gas, Supplies, Equipment, Materials, and Other. Add a short job note when helpful.",
      },
      {
        title: "Export & File",
        body: "Create an organized tax-ready expense report for your records or tax professional. SnapTax does not file tax returns.",
      },
    ],
  },
  examplesTitle: "Examples of HVAC Expenses",
  examplesCategoryHeader: "SnapTax category",
  examples: [],
  productCategoryNote:
    "In SnapTax, expenses often map to Tools, Truck Gas, Supplies, Equipment, Materials, or Other.",
  checklist: {
    title: "HVAC Expense Recordkeeping Checklist",
    items: [
      "Photograph paper receipts as soon as possible",
      "Save email and online purchase receipts",
      "Record the merchant, date, and total",
      "Note the business purpose",
      "Add the customer or job when relevant",
      "Separate personal and business purchases",
      "Keep mileage records separately",
      "Review uncertain transactions regularly",
      "Export an annual expense summary",
      "Ask a qualified tax professional about uncertain deductions",
    ],
  },
  builtFor: {
    title: "Built for independent HVAC professionals",
    body: "SnapTax is an expense organization tool for technicians and small HVAC businesses. It is not payroll software, a full accounting platform, or a tax-filing service.",
    features: [
      {
        title: "Receipt Scanner",
        body: "Capture supplier and job-site receipts quickly.",
      },
      {
        title: "Expense Tracking",
        body: "Keep business purchases organized before tax season.",
      },
      {
        title: "Tax Reports",
        body: "Export structured records for your accountant.",
      },
    ],
  },
  relatedTrades: {
    title: "Tax deductions for other trades",
    links: [
      {
        href: "/tax-deductions/electrician",
        label: "Electrician Tax Deductions",
      },
    ],
  },
  faq: [
    {
      question: "What can HVAC technicians deduct?",
      answer:
        "Potential business expenses may include qualifying tools, equipment, parts, supplies, safety gear, licenses, training, insurance, business vehicle costs, software, advertising, and professional services. Deductibility depends on the nature of the expense, its business use, and your circumstances.",
    },
    {
      question: "Can HVAC tools be written off?",
      answer:
        "Tools purchased for HVAC work may qualify as business expenses. Tax treatment can depend on cost, useful life, and business-use percentage.",
    },
    {
      question: "Can I deduct service truck expenses?",
      answer:
        "Business vehicle expenses may be deductible, but personal commuting and business travel must be distinguished. Keep records that support the business use of the vehicle.",
    },
    {
      question: "Can I deduct EPA 608 certification?",
      answer:
        "Certification, renewal, and training expenses related to skills used in an existing HVAC business may qualify, depending on the circumstances.",
    },
    {
      question: "Does SnapTax track mileage?",
      answer:
        "SnapTax can help organize vehicle-related receipts, but it does not currently replace a complete mileage log. Keep a separate record of the date, destination, distance, and business purpose of each trip.",
    },
    {
      question: "Can I export reports for my accountant?",
      answer:
        "Yes. You can export an organized expense report and use it when reviewing your records with an accountant or tax preparer.",
    },
  ],
  finalCta: {
    title: "Stop letting HVAC receipts disappear in your truck",
    body: "Capture each receipt when you get it, organize the expense, and build a cleaner record for tax season.",
    button: "Start Tracking Expenses",
    noCardRequired: "No forced sign-up. No complicated accounting setup.",
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
      href: "/blog/how-to-organize-receipts",
      label: "How to organize receipts",
    },
    {
      href: "/blog/1099-contractor-tax-guide",
      label: "1099 contractor tax guide",
    },
  ],
  disclaimer:
    "SnapTax helps users organize receipts and business expense records. It does not provide tax, legal, or accounting advice and does not prepare or file tax returns. Tax rules vary by situation and may change. Consult a qualified tax professional regarding your specific circumstances.",
};
