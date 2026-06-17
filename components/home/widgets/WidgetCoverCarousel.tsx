"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { HomeWidgetsData } from "@/lib/home/computeHomeWidgets";
import {
  adjacentIndex,
  buildWidgetSlides,
  swipeDirection,
  type WidgetSlideId,
} from "@/lib/home/widgetCarouselSlots";
import {
  coverFlowTransform,
  focusFromOffset,
  slideOffsetFromCenter,
  trackTranslateX,
} from "@/lib/home/widgetCoverMotion";
import { homeVisual } from "@/lib/ui/homeVisual";
import { TaxDeadlineWidget } from "./TaxDeadlineWidget";
import { MissingDeductionsWidget } from "./MissingDeductionsWidget";
import { TaxYearProgressWidget } from "./TaxYearProgressWidget";

const GAP_PX = 6;
const DEFAULT_VIEWPORT_WIDTH = 390;

interface WidgetCoverCarouselProps {
  data: HomeWidgetsData;
  onDeadlineDetails: () => void;
  onMissingReview: () => void;
  onProgressDetails: () => void;
}

export function WidgetCoverCarousel({
  data,
  onDeadlineDetails,
  onMissingReview,
  onProgressDetails,
}: WidgetCoverCarouselProps) {
  const cover = homeVisual.widgetCover;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartDragOffset = useRef(0);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef(0);

  const showMissing = data.missing.missing.length > 0;
  const slides = useMemo(() => buildWidgetSlides(showMissing), [showMissing]);
  const safeIndex = slides.length > 0 ? activeIndex % slides.length : 0;
  const slideWidthPx =
    viewportWidth > 0
      ? Math.min(160, Math.round(viewportWidth * 0.36))
      : 140;
  const viewportWidthPx = viewportWidth || DEFAULT_VIEWPORT_WIDTH;

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const update = () => setViewportWidth(el.clientWidth);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    dragOffsetRef.current = dragOffsetPx;
  }, [dragOffsetPx]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setActiveIndex((index) => (slides.length > 0 ? index % slides.length : 0));
  }, [slides.length]);

  const beginAnimate = useCallback(() => {
    if (reducedMotion) return;
    setIsAnimating(true);
  }, [reducedMotion]);

  const openDetails = useCallback(
    (id: WidgetSlideId) => {
      if (id === "deadline") onDeadlineDetails();
      else if (id === "missing") onMissingReview();
      else onProgressDetails();
    },
    [onDeadlineDetails, onMissingReview, onProgressDetails],
  );

  const renderSlide = useCallback(
    (id: WidgetSlideId, focus: "side" | "center") => {
      switch (id) {
        case "deadline":
          return <TaxDeadlineWidget data={data.deadline} focus={focus} />;
        case "missing":
          return <MissingDeductionsWidget data={data.missing} focus={focus} />;
        case "progress":
          return <TaxYearProgressWidget data={data.progress} focus={focus} />;
      }
    },
    [data],
  );

  const handleSlidePress = useCallback(
    (index: number, offset: number) => {
      if (isAnimating) return;
      if (slides.length <= 1) {
        openDetails(slides[0] ?? "deadline");
        return;
      }
      if (Math.abs(offset) < 0.35) {
        openDetails(slides[index]!);
        return;
      }
      if (index !== safeIndex) {
        beginAnimate();
        setActiveIndex(index);
      }
    },
    [beginAnimate, isAnimating, openDetails, safeIndex, slides],
  );

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? 0;
    touchStartY.current = e.touches[0]?.clientY ?? 0;
    touchStartDragOffset.current = dragOffsetRef.current;
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (slides.length <= 1) return;
      const x = e.touches[0]?.clientX ?? 0;
      const y = e.touches[0]?.clientY ?? 0;
      const dx = x - touchStartX.current;
      const dy = y - touchStartY.current;
      if (Math.abs(dx) < Math.abs(dy)) return;
      isDraggingRef.current = true;
      setIsDragging(true);
      setDragOffsetPx(touchStartDragOffset.current + dx);
    },
    [slides.length],
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (slides.length <= 1) return;
      const endX = e.changedTouches[0]?.clientX ?? 0;
      const endY = e.changedTouches[0]?.clientY ?? 0;
      const dx = endX - touchStartX.current;
      const dy = endY - touchStartY.current;

      if (isDraggingRef.current) {
        const dragDelta = dragOffsetRef.current - touchStartDragOffset.current;
        if (Math.abs(dragDelta) < 40) {
          beginAnimate();
          setDragOffsetPx(0);
        } else {
          const dir = swipeDirection(dragDelta);
          if (dir != null) {
            beginAnimate();
            setActiveIndex(adjacentIndex(safeIndex, dir, slides.length));
          }
          setDragOffsetPx(0);
        }
        isDraggingRef.current = false;
        setIsDragging(false);
        return;
      }

      if (Math.abs(dx) < Math.abs(dy)) return;
      const dir = swipeDirection(dx);
      if (dir == null) return;
      beginAnimate();
      setActiveIndex(adjacentIndex(safeIndex, dir, slides.length));
    },
    [beginAnimate, safeIndex, slides.length],
  );

  const tx = trackTranslateX({
    viewportWidthPx,
    slideWidthPx,
    gapPx: GAP_PX,
    activeIndex: safeIndex,
    dragOffsetPx,
  });

  const motionActive = isDragging || isAnimating;
  const trackClass = `${cover.track} ${cover.trackMotion}${
    motionActive ? " will-change-transform" : ""
  }`;
  const disableTransition = isDragging || reducedMotion;

  return (
    <div
      className={cover.shell}
      style={{ background: homeVisual.trustBar.heroFade }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Tax insights"
    >
      <div ref={viewportRef} className={cover.viewport}>
        <div
          className={trackClass}
          style={{
            transform: `translateX(${tx}px)`,
            transition: disableTransition ? "none" : undefined,
          }}
          onTransitionEnd={() => setIsAnimating(false)}
        >
          {slides.map((id, index) => {
            const offset = slideOffsetFromCenter({
              slideIndex: index,
              slideWidthPx,
              gapPx: GAP_PX,
              viewportWidthPx,
              trackTranslateX: tx,
            });
            const motion = coverFlowTransform(offset, { reducedMotion });
            const focus = focusFromOffset(offset);
            const isCenter = Math.abs(offset) < 0.35;

            return (
              <div
                key={id}
                className={`${cover.slide}${disableTransition ? "" : ` ${cover.slideMotion}`}`}
                style={{
                  width: slideWidthPx,
                  height: motion.height,
                  opacity: motion.opacity,
                  zIndex: motion.zIndex,
                  transform: motion.transform,
                  transition: disableTransition ? "none" : undefined,
                }}
              >
                <button
                  type="button"
                  className={cover.slideButton}
                  style={{ height: motion.height }}
                  aria-current={isCenter ? "true" : undefined}
                  onClick={() => handleSlidePress(index, offset)}
                >
                  {renderSlide(id, focus)}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
