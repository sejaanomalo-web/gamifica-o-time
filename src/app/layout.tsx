import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
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
  themeColor: "#000000",
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
      <body className="bg-anomalo-black text-anomalo-white font-sans min-h-full flex flex-col">
        {children}
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#0A0A0A",
              border: "1px solid rgba(201,149,58,0.32)",
              color: "#FFF",
              borderRadius: 0,
            },
          }}
        />
      </body>
    </html>
  );
}
