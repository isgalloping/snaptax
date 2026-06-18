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
  wrapIndex,
  type WidgetSlideId,
} from "@/lib/home/widgetCarouselSlots";
import {
  buildSlidePlacements,
  COVER_FLOW_DURATION_MS,
  coverFlowEase,
  coverFlowTransform,
  focusFromOffset,
  resolveAnimationTarget,
} from "@/lib/home/widgetCoverMotion";
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

export function WidgetCoverCarousel({
  data,
  onDeadlineDetails,
  onMissingReview,
  onProgressDetails,
}: WidgetCoverCarouselProps) {
  const cover = homeVisual.widgetCover;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [committedIndex, setCommittedIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartDisplayIndex = useRef(0);
  const isDraggingRef = useRef(false);
  const displayIndexRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const showMissing = data.missing.missing.length > 0;
  const slides = useMemo(() => buildWidgetSlides(showMissing), [showMissing]);
  const slideCount = slides.length;
  const stridePx = viewportWidth > 0 ? viewportWidth * 0.34 : 140;
  const slideWidthPx =
    viewportWidth > 0
      ? Math.min(160, Math.round(viewportWidth * 0.36))
      : 140;

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
    displayIndexRef.current = displayIndex;
  }, [displayIndex]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setCommittedIndex((index) =>
      slideCount > 0 ? index % slideCount : 0,
    );
    setDisplayIndex((index) =>
      slideCount > 0 ? index % slideCount : 0,
    );
  }, [slideCount]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current != null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsAnimating(false);
  }, []);

  const animateDisplayTo = useCallback(
    (
      targetCommitted: number,
      direction?: -1 | 1,
      onComplete?: () => void,
    ) => {
      cancelAnimation();
      const count = slideCount;
      if (count <= 1) {
        setCommittedIndex(0);
        setDisplayIndex(0);
        onComplete?.();
        return;
      }

      const from = displayIndexRef.current;
      const wrappedTarget = wrapIndex(targetCommitted, count);
      const endDisplay = resolveAnimationTarget(
        from,
        wrappedTarget,
        count,
        direction,
      );

      if (reducedMotion) {
        setDisplayIndex(wrappedTarget);
        setCommittedIndex(wrappedTarget);
        onComplete?.();
        return;
      }

      setIsAnimating(true);
      const start = performance.now();

      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / COVER_FLOW_DURATION_MS);
        const eased = coverFlowEase(t);
        setDisplayIndex(from + (endDisplay - from) * eased);
        if (t < 1) {
          animationFrameRef.current = requestAnimationFrame(frame);
          return;
        }
        animationFrameRef.current = null;
        setDisplayIndex(wrappedTarget);
        setCommittedIndex(wrappedTarget);
        setIsAnimating(false);
        onComplete?.();
      };

      animationFrameRef.current = requestAnimationFrame(frame);
    },
    [cancelAnimation, reducedMotion, slideCount],
  );

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
    (slideIndex: number, offset: number) => {
      if (isAnimating || isDragging) return;
      if (slideCount <= 1) {
        openDetails(slides[0] ?? "deadline");
        return;
      }
      if (Math.abs(offset) < 0.35) {
        openDetails(slides[slideIndex]!);
        return;
      }
      const direction = offset < 0 ? -1 : 1;
      const target = adjacentIndex(committedIndex, direction, slideCount);
      animateDisplayTo(target, direction);
    },
    [
      animateDisplayTo,
      committedIndex,
      isAnimating,
      isDragging,
      openDetails,
      slideCount,
      slides,
    ],
  );

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    cancelAnimation();
    touchStartX.current = e.touches[0]?.clientX ?? 0;
    touchStartY.current = e.touches[0]?.clientY ?? 0;
    touchStartDisplayIndex.current = displayIndexRef.current;
    isDraggingRef.current = false;
    setIsDragging(false);
  }, [cancelAnimation]);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (slideCount <= 1) return;
      const x = e.touches[0]?.clientX ?? 0;
      const y = e.touches[0]?.clientY ?? 0;
      const dx = x - touchStartX.current;
      const dy = y - touchStartY.current;
      if (Math.abs(dx) < Math.abs(dy)) return;
      isDraggingRef.current = true;
      setIsDragging(true);
      setDisplayIndex(touchStartDisplayIndex.current - dx / stridePx);
    },
    [slideCount, stridePx],
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (slideCount <= 1) return;
      const endX = e.changedTouches[0]?.clientX ?? 0;
      const endY = e.changedTouches[0]?.clientY ?? 0;
      const dx = endX - touchStartX.current;
      const dy = endY - touchStartY.current;

      if (isDraggingRef.current) {
        const dir = swipeDirection(dx);
        const target =
          dir == null
            ? committedIndex
            : adjacentIndex(committedIndex, dir, slideCount);
        animateDisplayTo(target, dir ?? undefined);
        isDraggingRef.current = false;
        setIsDragging(false);
        return;
      }

      if (Math.abs(dx) < Math.abs(dy)) return;
      const dir = swipeDirection(dx);
      if (dir == null) return;
      animateDisplayTo(adjacentIndex(committedIndex, dir, slideCount), dir);
    },
    [animateDisplayTo, committedIndex, slideCount],
  );

  const placements = buildSlidePlacements(displayIndex, slideCount);
  const motionActive = isDragging || isAnimating;

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
        <div className={cover.track}>
          {placements.map(({ slideIndex, offset, key }) => {
            const motion = coverFlowTransform(offset, { reducedMotion });
            const focus = focusFromOffset(offset);
            const slideId = slides[slideIndex]!;
            const isCenter = Math.abs(offset) < 0.35;

            return (
              <div
                key={key}
                className={`${cover.slideWrapper}${
                  isDragging || reducedMotion ? "" : ` ${cover.slideMotion}`
                }${motionActive ? " will-change-transform" : ""}`}
                style={{
                  width: slideWidthPx,
                  height: motion.height,
                  left: `calc(50% + ${offset * stridePx}px)`,
                  opacity: motion.opacity,
                  zIndex: motion.zIndex,
                  transform: motion.transform,
                  transition: isDragging || reducedMotion ? "none" : undefined,
                }}
              >
                <button
                  type="button"
                  className={cover.slideButton}
                  style={{ height: motion.height }}
                  aria-current={isCenter ? "true" : undefined}
                  onClick={() => handleSlidePress(slideIndex, offset)}
                >
                  {renderSlide(slideId, focus)}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
