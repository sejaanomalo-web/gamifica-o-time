import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Anômalo Meta",
    short_name: "Anômalo",
    description: "Sistema interno de gamificação por metas da Anômalo Hub.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
