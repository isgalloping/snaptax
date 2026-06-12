import type { MetadataRoute } from "next";
import { USER_COPY } from "@/lib/copy/userFacing";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    related_applications: [
      {
        platform: "webapp",
        url: "/manifest.webmanifest",
        id: "/",
      },
    ],
    name: "Snap1099",
    short_name: "Snap1099",
    description: USER_COPY.app.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
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
