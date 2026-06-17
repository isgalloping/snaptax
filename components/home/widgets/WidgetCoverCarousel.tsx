"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HomeWidgetsData } from "@/lib/home/computeHomeWidgets";
import {
  adjacentIndex,
  buildWidgetSlides,
  carouselTriple,
  swipeDirection,
  type WidgetSlideId,
} from "@/lib/home/widgetCarouselSlots";
import { homeVisual } from "@/lib/ui/homeVisual";
import { TaxDeadlineWidget } from "./TaxDeadlineWidget";
import { MissingDeductionsWidget } from "./MissingDeductionsWidget";
import { TaxYearProgressWidget } from "./TaxYearProgressWidget";

interface WidgetCoverCarouselProps {
  data: HomeWidgetsData;
  onDeadlineDetails: () => void;
  onMissingReview: () => void;
  onProgressDetails: () => void;
}

type Slot = "left" | "center" | "right";

export function WidgetCoverCarousel({
  data,
  onDeadlineDetails,
  onMissingReview,
  onProgressDetails,
}: WidgetCoverCarouselProps) {
  const showMissing = data.missing.missing.length > 0;
  const slides = useMemo(
    () => buildWidgetSlides(showMissing),
    [showMissing],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const cover = homeVisual.widgetCover;

  const safeIndex = slides.length > 0 ? activeIndex % slides.length : 0;

  useEffect(() => {
    setActiveIndex((index) =>
      slides.length > 0 ? index % slides.length : 0,
    );
  }, [slides.length]);

  const [leftIdx, centerIdx, rightIdx] = carouselTriple(safeIndex, slides.length);

  const openDetails = useCallback(
    (id: WidgetSlideId) => {
      if (id === "deadline") onDeadlineDetails();
      else if (id === "missing") onMissingReview();
      else onProgressDetails();
    },
    [onDeadlineDetails, onMissingReview, onProgressDetails],
  );

  const handleSlotPress = useCallback(
    (slot: Slot) => {
      if (slides.length <= 1) {
        openDetails(slides[0] ?? "deadline");
        return;
      }
      if (slot === "center") {
        openDetails(slides[safeIndex]!);
        return;
      }
      if (slot === "left") {
        setActiveIndex(adjacentIndex(safeIndex, -1, slides.length));
        return;
      }
      setActiveIndex(adjacentIndex(safeIndex, 1, slides.length));
    },
    [openDetails, safeIndex, slides],
  );

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? 0;
    touchStartY.current = e.touches[0]?.clientY ?? 0;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (slides.length <= 1) return;
      const endX = e.changedTouches[0]?.clientX ?? 0;
      const endY = e.changedTouches[0]?.clientY ?? 0;
      const dx = endX - touchStartX.current;
      const dy = endY - touchStartY.current;
      if (Math.abs(dx) < Math.abs(dy)) return;
      const dir = swipeDirection(dx);
      if (dir == null) return;
      setActiveIndex(adjacentIndex(safeIndex, dir, slides.length));
    },
    [safeIndex, slides.length],
  );

  const renderSlide = (id: WidgetSlideId, focus: "side" | "center") => {
    switch (id) {
      case "deadline":
        return <TaxDeadlineWidget data={data.deadline} focus={focus} />;
      case "missing":
        return <MissingDeductionsWidget data={data.missing} focus={focus} />;
      case "progress":
        return <TaxYearProgressWidget data={data.progress} focus={focus} />;
    }
  };

  const slots: { slot: Slot; index: number; focus: "side" | "center" }[] = [
    { slot: "left", index: leftIdx, focus: "side" },
    { slot: "center", index: centerIdx, focus: "center" },
    { slot: "right", index: rightIdx, focus: "side" },
  ];

  return (
    <div
      className={cover.shell}
      style={{ background: homeVisual.trustBar.heroFade }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Tax insights"
    >
      <div className={cover.track}>
        {slots.map(({ slot, index, focus }) => (
          <div
            key={slot}
            className={focus === "center" ? cover.slotCenter : cover.slotSide}
          >
            <button
              type="button"
              onClick={() => handleSlotPress(slot)}
              className={`${cover.cardBase} ${
                focus === "center" ? cover.cardCenter : cover.cardSide
              } w-full`}
              aria-current={focus === "center" ? "true" : undefined}
            >
              {renderSlide(slides[index]!, focus)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
