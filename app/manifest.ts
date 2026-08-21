import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Personal OS — Hayat, Proje & Bilgi Sistemi",
    short_name: "Personal OS",
    description: "Görevlerini, projelerini, notlarını ve gelişim sistemini tek yerde yönet.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0b0d0c",
    theme_color: "#0b0d0c",
    categories: ["productivity", "lifestyle", "utilities"],
    lang: "tr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Görevler", short_name: "Görevler", url: "/tasks", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Projeler", short_name: "Projeler", url: "/projects", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Ses kaydı", short_name: "Ses", url: "/career?area=diction", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
