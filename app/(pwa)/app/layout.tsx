import type { Metadata } from "next";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { getAppDisplayName } from "@/lib/site/appDisplayName";

export const metadata: Metadata = {
  title: getAppDisplayName(),
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
