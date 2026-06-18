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
import { NeedActionWidget } from "./NeedActionWidget";

interface WidgetPagerProps {
  data: HomeWidgetsData;
  actionCount: number;
  onDeadlineDetails: () => void;
  onMissingReview: () => void;
  onProgressDetails: () => void;
  onExport: () => void;
  onNeedActionResnap: () => void;
}

function renderWidget(
  key: WidgetPageKey,
  data: HomeWidgetsData,
  actionCount: number,
  handlers: Omit<WidgetPagerProps, "data" | "actionCount">,
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
    case "needAction":
      return (
        <NeedActionWidget actionCount={actionCount} onResnap={handlers.onNeedActionResnap} />
      );
  }
}

export function WidgetPager({
  data,
  actionCount,
  onDeadlineDetails,
  onMissingReview,
  onProgressDetails,
  onExport,
  onNeedActionResnap,
}: WidgetPagerProps) {
  const pages = buildWidgetPages(data, actionCount);
  const paginated = pages.length > 1;
  const viewportRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const [activePage, setActivePage] = useState(0);
  const pager = homeVisual.widgetPager;

  const syncActivePage = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || viewport.clientWidth === 0) return;
    const index = Math.round(viewport.scrollLeft / viewport.clientWidth);
    setActivePage(Math.min(Math.max(index, 0), pages.length - 1));
  }, [pages.length]);

  const scrollToPage = useCallback(
    (pageIndex: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      viewport.scrollTo({ left: viewport.clientWidth * pageIndex, behavior: "auto" });
      setActivePage(pageIndex);
    },
    [],
  );

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? 0;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!paginated || pages.length < 2) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const dx = endX - touchStartX.current;
    if (Math.abs(dx) < 40) return;

    if (dx < 0 && activePage >= pages.length - 1) {
      scrollToPage(0);
    } else if (dx > 0 && activePage <= 0) {
      scrollToPage(pages.length - 1);
    }
  };

  const handlers = {
    onDeadlineDetails,
    onMissingReview,
    onProgressDetails,
    onExport,
    onNeedActionResnap,
  };

  return (
    <div className={pager.container}>
      <div
        ref={viewportRef}
        className={paginated ? pager.viewportPaginated : pager.viewport}
        role="list"
        aria-label="Tax insights"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {pages.map((pageKeys, pageIndex) => (
          <div key={pageIndex} className={pager.page} aria-label={`Widget page ${pageIndex + 1}`}>
            {pageKeys.map((key) => (
              <div key={key} className={pageColumnFlexClass(pageKeys.length)}>
                {renderWidget(key, data, actionCount, handlers)}
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
