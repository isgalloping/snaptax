import type { Metadata } from "next";
import { PwaProvider } from "@/components/pwa/PwaProvider";

export const metadata: Metadata = {
  title: "SnapTax",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PwaAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PwaProvider>
      <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-black">
        {children}
      </div>
    </PwaProvider>
  );
}
