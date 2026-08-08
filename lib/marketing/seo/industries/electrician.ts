import type { IndustrySeoPage } from "@/lib/marketing/seo/types";

export const ELECTRICIAN_SEO_PAGE: IndustrySeoPage = {
  slug: "electrician",
  path: "/tax-deductions/electrician",
  label: "Electricians",
  indexBlurb:
    "Common tax deductions for tools, vehicles, supplies, and job-site expenses.",
  seo: {
    title:
      "Electrician Tax Deductions Checklist (Tools, Truck & Business Expenses)",
    description:
      "Learn common tax deductions for electricians including tools, vehicles, supplies, and business expenses. Track receipts and prepare tax-ready reports with SnapTax.",
  },
  hero: {
    h1: "Electrician Tax Deductions Checklist:\nTrack Expenses and Keep More of What You Earn",
    subtitle: "Track Expenses. Save More. Stress Less.",
    body: "Electricians spend money on tools, equipment, vehicles, and supplies every day.\n\nSnapTax helps you organize receipts, track expenses, and prepare tax-ready reports before tax season.",
    primaryCta: "Start Tracking Expenses Free",
    secondaryCta: "See How SnapTax Works",
    trustItems: [
      "Built for Independent Electricians",
      "Receipt Scanning",
      "Tax-Ready Reports",
      "Secure & Private",
    ],
    workerImage: {
      src: "/marketing/seo/electrician-worker.png",
      alt: "Electrician working on an electrical panel",
    },
  },
  deductionsTitle: "Common Tax Deductions for Electricians",
  deductionsIntro:
    "Electricians often have many business expenses throughout the year. Keeping accurate records helps you understand your costs and prepare for tax season.",
  deductionCards: [
    {
      title: "Tools & Equipment",
      body: "Electrical tools are essential for your work.",
      examples: [
        "Multimeters",
        "Drills",
        "Hand tools",
        "Testing equipment",
        "Safety equipment",
      ],
    },
    {
      title: "Vehicle Expenses",
      body: "Many electricians travel between jobs.",
      examples: ["Work truck", "Mileage", "Fuel", "Maintenance", "Insurance"],
    },
    {
      title: "Materials & Supplies",
      body: "Daily electrical jobs require many supplies:",
      examples: [
        "Wire",
        "Switches",
        "Fixtures",
        "Connectors",
        "Replacement parts",
      ],
    },
    {
      title: "Training & Licensing",
      body: "Professional development expenses may include:",
      examples: [
        "Certifications",
        "Safety training",
        "Continuing education",
      ],
    },
    {
      title: "Business Operations",
      body: "Running an electrical business also involves:",
      examples: ["Insurance", "Phone bills", "Software", "Office expenses"],
    },
  ],
  problemsTitle: "Don't Lose Track of Your Expenses",
  problems: [
    {
      title: "Too Many Receipts",
      body: "Home Depot. Lowe's. Electrical suppliers. Receipts quickly pile up.",
      solution: "Snap a photo and store receipts instantly.",
    },
    {
      title: "Hard to Remember Categories",
      body: "Was this purchase a tool? A supply? A vehicle expense?",
      solution: "SnapTax helps organize expenses automatically.",
    },
    {
      title: "Tax Season Stress",
      body: "Finding receipts at the end of the year takes time.",
      solution: "Export organized reports when you need them.",
    },
  ],
  howItWorks: {
    id: "how-it-works",
    title: "How SnapTax Works for Electricians",
    steps: [
      {
        title: "Snap Receipts",
        body: "Take a photo of any receipt. SnapTax extracts the details automatically.",
      },
      {
        title: "Track Expenses",
        body: "Expenses are organized into useful categories such as Tools, Truck Gas, Supplies, Equipment, and Materials.",
      },
      {
        title: "Export Tax Reports",
        body: "Prepare organized expense reports for tax season.",
      },
    ],
  },
  examplesTitle: "Examples of Electrician Expenses",
  examples: [
    { expense: "Cordless Drill", category: "Tools" },
    { expense: "Voltage Tester", category: "Equipment" },
    { expense: "Electrical Wire", category: "Supplies" },
    { expense: "Work Van Fuel", category: "Vehicle" },
    { expense: "Safety Gear", category: "Equipment" },
    { expense: "Business Insurance", category: "Operations" },
    { expense: "License Renewal", category: "Professional Fees" },
  ],
  productCategoryNote:
    "In SnapTax, expenses often map to Tools, Truck Gas, Supplies, Equipment, Materials, or Other.",
  builtFor: {
    title: "Built for Independent Electricians",
    body: "SnapTax is designed for contractors who work in the field. No complicated accounting setup. No unnecessary features. Just capture receipts, organize expenses, and stay prepared.",
    features: [
      {
        title: "Receipt Scanner",
        body: "Automatically capture receipt information.",
      },
      {
        title: "Expense Tracking",
        body: "Know where your money goes.",
      },
      {
        title: "Tax Reports",
        body: "Export organized records.",
      },
    ],
  },
  faq: [
    {
      question: "Can electricians deduct tools?",
      answer:
        "Tools used for electrical work are common business expenses. Keeping receipts helps maintain accurate records.",
    },
    {
      question: "Can electricians deduct mileage?",
      answer:
        "Electricians who travel for business often track mileage as part of their expense records.",
    },
    {
      question: "Should electricians keep receipts?",
      answer:
        "Keeping organized receipts makes expense tracking and tax preparation easier.",
    },
    {
      question: "How do electricians track business expenses?",
      answer:
        "Many contractors use expense tracking tools to organize receipts, categorize purchases, and prepare reports.",
    },
  ],
  finalCta: {
    title: "Ready for a simpler tax season?",
    body: "Start organizing your electrician expenses today.",
    button: "Start Tracking Free",
    noCardRequired: "No credit card required.",
  },
  outboundLinks: [
    { href: "/features", label: "SnapTax features" },
    { href: "/faq", label: "FAQ" },
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
    "For educational purposes only. Not tax advice. Confirm deductions with a qualified professional.",
};
