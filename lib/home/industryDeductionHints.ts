import type { Industry } from "@/lib/types";

export interface DeductionHint {
  id: string;
  label: string;
  categoryKeys: string[];
  defaultEstimate: number;
  whyItMatters: string;
}

const HINTS: Record<Industry, DeductionHint[]> = {
  truck_driver: [
    {
      id: "vehicle_mileage",
      label: "Vehicle Mileage",
      categoryKeys: ["TRUCK GAS", "VEHICLE", "MILEAGE", "PARKING"],
      defaultEstimate: 2000,
      whyItMatters:
        "Business miles and vehicle costs are among the largest deductions for drivers.",
    },
    {
      id: "phone_usage",
      label: "Phone Usage",
      categoryKeys: ["PHONE", "COMMUNICATION"],
      defaultEstimate: 600,
      whyItMatters: "A business-use share of your phone bill is deductible.",
    },
    {
      id: "safety_gear",
      label: "Safety Gear",
      categoryKeys: ["SAFETY", "EQUIPMENT", "SUPPLIES"],
      defaultEstimate: 400,
      whyItMatters: "Required PPE and safety equipment for the job site counts.",
    },
  ],
  construction: [
    {
      id: "tools_equipment",
      label: "Tools & Equipment",
      categoryKeys: ["TOOLS", "EQUIPMENT", "MATERIALS"],
      defaultEstimate: 1500,
      whyItMatters: "Job-site tools and gear are core Schedule C expenses.",
    },
    {
      id: "safety_gear",
      label: "Safety Gear",
      categoryKeys: ["SAFETY", "SUPPLIES", "EQUIPMENT"],
      defaultEstimate: 400,
      whyItMatters: "Hard hats, boots, and PPE add up over a tax year.",
    },
    {
      id: "vehicle_mileage",
      label: "Vehicle Mileage",
      categoryKeys: ["TRUCK GAS", "VEHICLE", "MILEAGE"],
      defaultEstimate: 1200,
      whyItMatters: "Travel between job sites is deductible business mileage.",
    },
  ],
  plumber: [
    {
      id: "tools_equipment",
      label: "Tools & Equipment",
      categoryKeys: ["TOOLS", "EQUIPMENT"],
      defaultEstimate: 1200,
      whyItMatters: "Specialty tools and parts are everyday business expenses.",
    },
    {
      id: "vehicle_mileage",
      label: "Vehicle Mileage",
      categoryKeys: ["TRUCK GAS", "VEHICLE", "MILEAGE"],
      defaultEstimate: 1000,
      whyItMatters: "Service calls and supply runs count as business driving.",
    },
    {
      id: "supplies",
      label: "Supplies",
      categoryKeys: ["SUPPLIES", "MATERIALS"],
      defaultEstimate: 800,
      whyItMatters: "Consumables used on jobs are deductible when documented.",
    },
  ],
  electrician: [
    {
      id: "tools_equipment",
      label: "Tools & Equipment",
      categoryKeys: ["TOOLS", "EQUIPMENT"],
      defaultEstimate: 1500,
      whyItMatters: "Meters, ladders, and power tools are deductible assets.",
    },
    {
      id: "safety_gear",
      label: "Safety Gear",
      categoryKeys: ["SAFETY", "SUPPLIES", "EQUIPMENT"],
      defaultEstimate: 350,
      whyItMatters: "Insulated gloves and safety gear protect you and your taxes.",
    },
    {
      id: "vehicle_mileage",
      label: "Vehicle Mileage",
      categoryKeys: ["TRUCK GAS", "VEHICLE", "MILEAGE"],
      defaultEstimate: 900,
      whyItMatters: "Driving to panels and job sites is business mileage.",
    },
  ],
  delivery: [
    {
      id: "vehicle_mileage",
      label: "Vehicle Mileage",
      categoryKeys: ["TRUCK GAS", "VEHICLE", "MILEAGE"],
      defaultEstimate: 2500,
      whyItMatters: "Delivery driving is your biggest deductible category.",
    },
    {
      id: "phone_usage",
      label: "Phone Usage",
      categoryKeys: ["PHONE", "COMMUNICATION"],
      defaultEstimate: 500,
      whyItMatters: "Dispatch and routing apps mean a deductible phone share.",
    },
    {
      id: "parking_tolls",
      label: "Parking & Tolls",
      categoryKeys: ["PARKING", "TOLLS", "OTHER"],
      defaultEstimate: 300,
      whyItMatters: "Parking and tolls on delivery runs add up quickly.",
    },
  ],
  general: [
    {
      id: "phone_usage",
      label: "Phone Usage",
      categoryKeys: ["PHONE", "COMMUNICATION"],
      defaultEstimate: 600,
      whyItMatters: "Business calls and data are partially deductible.",
    },
    {
      id: "home_office",
      label: "Home Office",
      categoryKeys: ["OFFICE", "SUPPLIES", "OTHER"],
      defaultEstimate: 800,
      whyItMatters: "A dedicated workspace may qualify for home office deductions.",
    },
    {
      id: "professional_services",
      label: "Professional Services",
      categoryKeys: ["OTHER", "SUPPLIES"],
      defaultEstimate: 500,
      whyItMatters: "Software, bookkeeping, and pro services are deductible.",
    },
  ],
};

export function hintsForIndustry(industry: Industry | null): DeductionHint[] {
  return HINTS[industry ?? "general"];
}

export function categoryMatchesHint(
  category: string | undefined,
  hint: DeductionHint,
): boolean {
  if (!category) return false;
  const normalized = category.toUpperCase().trim();
  return hint.categoryKeys.some(
    (key) => normalized.includes(key) || key.includes(normalized),
  );
}
