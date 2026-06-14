import { Suspense } from "react";
import { HelpPageContent } from "@/components/help/HelpPageContent";

export const metadata = {
  title: "Help · Snap1099",
};

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <HelpPageContent />
    </Suspense>
  );
}
