"use client";

import { forwardRef, type ReactNode } from "react";

interface HomeScrollRegionProps {
  children: ReactNode;
}

export const HomeScrollRegion = forwardRef<HTMLDivElement, HomeScrollRegionProps>(
  function HomeScrollRegion({ children }, ref) {
    return (
      <div ref={ref} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {children}
      </div>
    );
  },
);
