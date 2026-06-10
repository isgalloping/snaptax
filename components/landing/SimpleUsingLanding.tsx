"use client";

import { useEffect, useState } from "react";
import { LandingCameraHero } from "./LandingCameraHero";
import { SIMPLE_USING_CTA, SIMPLE_USING_STATUS_LINES } from "./simpleUsingCopy";

interface SimpleUsingLandingProps {
  onStart: () => void;
}

export function SimpleUsingLanding({ onStart }: SimpleUsingLandingProps) {
  const [ctaReady, setCtaReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setCtaReady(true), 600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="simple-using-landing relative flex h-full min-h-0 flex-col overflow-hidden bg-zinc-950 px-4 pb-6">
      <div
        className="data-stream-grid-bg pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
      />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="simple-using-hero flex flex-1 flex-col items-center justify-center pt-4">
          <div className="scale-110 sm:scale-125">
            <LandingCameraHero />
          </div>
          <ul className="simple-using-lines mt-8 w-full max-w-md space-y-3 px-1">
            {SIMPLE_USING_STATUS_LINES.map((line, index) => (
              <li
                key={line}
                className="simple-using-line font-mono text-sm leading-relaxed text-zinc-300/95 sm:text-[15px]"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={onStart}
          disabled={!ctaReady}
          className="simple-using-cta mt-4 min-h-16 w-full rounded-2xl bg-yellow-500 px-4 text-lg font-bold text-black transition-transform active:scale-95 disabled:cursor-default"
          aria-label="Let's start"
        >
          {SIMPLE_USING_CTA}
        </button>
      </div>
    </div>
  );
}
