import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GΛME Anômalo Hub",
    short_name: "Anômalo Hub",
    description: "Sistema interno de gamificação e comissionamento da Anômalo Hub.",
    start_url: "/pa",
    display: "standalone",
    background_color: "#070709",
    theme_color: "#070709",
    lang: "pt-BR",
    icons: [
      // PNG raster — wordmark GΛME dourado sobre preto.
      // "any" = ícone normal, "maskable" = variante com área de respiro
      // de 12.5% pra Android adaptive icons (recorte circular/squircle).
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-1024.png", sizes: "1024x1024", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
