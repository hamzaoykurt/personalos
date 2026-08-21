import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./base.css";
import "./personal-os.css";
import "./personal-os-sections.css";
import "./personal-os-overlays.css";
import PwaRegistration from "./components/pwa/PwaRegistration";

const themeBootScript = `(() => {
  try {
    const saved = localStorage.getItem("personal-os-theme");
    const theme = saved === "light" || saved === "dark"
      ? saved
      : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
  }
})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0d0c" },
    { media: "(prefers-color-scheme: light)", color: "#f2eee4" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const description =
    "Görevleri, projeleri ve bilgiyi tek bir sakin çalışma alanında birleştiren kişisel işletim sistemi.";

  return {
    metadataBase: new URL(origin),
    applicationName: "Personal OS",
    manifest: "/manifest.webmanifest",
    title: {
      default: "Personal OS — Hayat, Proje & Bilgi Sistemi",
      template: "%s · Personal OS",
    },
    description,
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      ],
      shortcut: "/favicon.svg",
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    appleWebApp: {
      capable: true,
      title: "Personal OS",
      statusBarStyle: "black-translucent",
    },
    formatDetection: { telephone: false },
    openGraph: {
      title: "Personal OS",
      description,
      type: "website",
      images: [`${origin}/og.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: "Personal OS",
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}
