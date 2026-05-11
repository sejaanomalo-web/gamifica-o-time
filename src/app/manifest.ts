import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Game Anômalo Hub",
    short_name: "Anômalo Hub",
    description: "Sistema interno de gamificação e comissionamento da Anômalo Hub.",
    start_url: "/pa",
    display: "standalone",
    background_color: "#070709",
    theme_color: "#070709",
    lang: "pt-BR",
    icons: [
      // SVG vetorial — escala perfeitamente em qualquer tamanho.
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  };
}
