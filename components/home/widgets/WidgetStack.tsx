"use client";

import type { HomeWidgetsData } from "@/lib/home/computeHomeWidgets";
import { WidgetPager } from "./WidgetPager";

interface WidgetStackProps {
  data: HomeWidgetsData;
  actionCount: number;
  onDeadlineDetails: () => void;
  onMissingReview: () => void;
  onProgressDetails: () => void;
  onExport: () => void;
  onNeedActionResnap: () => void;
}

export function WidgetStack(props: WidgetStackProps) {
  return <WidgetPager {...props} />;
}
