"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeWidgetsData } from "@/lib/home/computeHomeWidgets";
import {
  buildWidgetPages,
  pageColumnFlexClass,
  type WidgetPageKey,
} from "@/lib/home/buildWidgetPages";
import { homeVisual } from "@/lib/ui/homeVisual";
import { TaxDeadlineWidget } from "./TaxDeadlineWidget";
import { MissingDeductionsWidget } from "./MissingDeductionsWidget";
import { TaxYearProgressWidget } from "./TaxYearProgressWidget";
import { CpaReadyWidget } from "./CpaReadyWidget";

interface WidgetPagerProps {
  data: HomeWidgetsData;
  onDeadlineDetails: () => void;
  onMissingReview: () => void;
  onProgressDetails: () => void;
  onExport: () => void;
}

function renderWidget(
  key: WidgetPageKey,
  data: HomeWidgetsData,
  handlers: Omit<WidgetPagerProps, "data">,
) {
  switch (key) {
    case "deadline":
      return (
        <TaxDeadlineWidget data={data.deadline} onViewDetails={handlers.onDeadlineDetails} />
      );
    case "missing":
      return (
        <MissingDeductionsWidget data={data.missing} onReview={handlers.onMissingReview} />
      );
    case "progress":
      return (
        <TaxYearProgressWidget
          data={data.progress}
          onOpenDetails={handlers.onProgressDetails}
        />
      );
    case "cpa":
      return <CpaReadyWidget count={data.cpaReadyCount} onExport={handlers.onExport} />;
  }
}

export function WidgetPager({
  data,
  onDeadlineDetails,
  onMissingReview,
  onProgressDetails,
  onExport,
}: WidgetPagerProps) {
  const pages = buildWidgetPages(data);
  const paginated = pages.length > 1;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const pager = homeVisual.widgetPager;

  const syncActivePage = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || viewport.clientWidth === 0) return;
    const index = Math.round(viewport.scrollLeft / viewport.clientWidth);
    setActivePage(Math.min(Math.max(index, 0), pages.length - 1));
  }, [pages.length]);

  useEffect(() => {
    if (!paginated) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.addEventListener("scroll", syncActivePage, { passive: true });
    window.addEventListener("resize", syncActivePage);
    return () => {
      viewport.removeEventListener("scroll", syncActivePage);
      window.removeEventListener("resize", syncActivePage);
    };
  }, [paginated, syncActivePage]);

  const handlers = {
    onDeadlineDetails,
    onMissingReview,
    onProgressDetails,
    onExport,
  };

  return (
    <div className={pager.container}>
      <div
        ref={viewportRef}
        className={paginated ? pager.viewportPaginated : pager.viewport}
        role="list"
        aria-label="Tax insights"
      >
        {pages.map((pageKeys, pageIndex) => (
          <div key={pageIndex} className={pager.page} aria-label={`Widget page ${pageIndex + 1}`}>
            {pageKeys.map((key) => (
              <div key={key} className={pageColumnFlexClass(pageKeys.length)}>
                {renderWidget(key, data, handlers)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {paginated && (
        <div className={pager.dots} aria-hidden>
          {pages.map((_, index) => (
            <span
              key={index}
              className={`${pager.dot} ${index === activePage ? pager.dotActive : ""}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
