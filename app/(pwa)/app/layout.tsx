import type { Metadata } from "next";
import { InstallCaptureScript } from "@/components/pwa/InstallCaptureScript";
import { PwaProvider } from "@/components/pwa/PwaProvider";

export const metadata: Metadata = {
  title: "Snap1099",
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
      <InstallCaptureScript />
      <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-black">
        {children}
      </div>
    </PwaProvider>
  );
}
