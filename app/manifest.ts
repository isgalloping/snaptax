import type { MetadataRoute } from "next";
import { USER_COPY } from "@/lib/copy/userFacing";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    related_applications: [
      {
        platform: "webapp",
        url: "/manifest.webmanifest",
        id: "/app",
      },
    ],
    name: "Snap1099",
    short_name: "Snap1099",
    description: USER_COPY.app.description,
    start_url: "/app",
    scope: "/app",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    launch_handler: {
      client_mode: "navigate-existing",
    },
    // Desktop Chrome 96+ / Navigation Capturing: open in-scope links in the PWA.
    capture_links: "existing-client-navigate",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
