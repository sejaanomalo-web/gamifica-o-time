import type { Metadata, Viewport } from "next";
import { Inter_Tight, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anômalo Meta",
  description: "Sistema interno de gamificação por metas da Anômalo Hub.",
  manifest: "/manifest.webmanifest",
  applicationName: "Anômalo Meta",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Anômalo Meta",
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
    <html
      lang="pt-BR"
      className={`${interTight.variable} ${instrumentSerif.variable} ${jetBrainsMono.variable} dark h-full antialiased`}
    >
      <body className="bg-[#070709] text-[#edebe6] font-sans min-h-full flex flex-col">
        {children}
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#111115",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "#edebe6",
              borderRadius: 20,
            },
          }}
        />
      </body>
    </html>
  );
}
