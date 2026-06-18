"use client";

import { forwardRef, type ReactNode } from "react";

interface HomeScrollRegionProps {
  header?: ReactNode;
  children: ReactNode;
}

export const HomeScrollRegion = forwardRef<HTMLDivElement, HomeScrollRegionProps>(
  function HomeScrollRegion({ header, children }, ref) {
    return (
      <div ref={ref} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {header}
        {children}
      </div>
    );
  },
);
