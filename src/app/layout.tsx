import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Inter primary — todos os pesos pra cobrir Light 300 / Regular / Medium /
// Semi / Bold / Black 900. Helvetica Neue / Arial entram no fallback CSS.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Game Anômalo",
  description: "Sistema interno de gamificação por metas da Anômalo Hub.",
  manifest: "/manifest.webmanifest",
  applicationName: "Game Anômalo",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Game Anômalo",
  },
};

export const viewport: Viewport = {
  themeColor: "#070709",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} dark h-full antialiased`}>
      <body className="bg-[#070709] text-white font-sans min-h-full flex flex-col">
        {children}
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#111115",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#FFFFFF",
              borderRadius: 20,
            },
          }}
        />
      </body>
    </html>
  );
}
