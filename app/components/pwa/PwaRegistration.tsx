"use client";

import { Download, ExternalLink, MoreVertical, Share2, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { isStandaloneApp, type InstallPromptEvent } from "@/lib/pwa";

type Platform = "android" | "ios" | "desktop";

function currentPlatform(): Platform {
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)) return "ios";
  if (/android/i.test(navigator.userAgent)) return "android";
  return "desktop";
}

async function showNativeInstallPrompt(prompt: InstallPromptEvent) {
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    window.__personalOSInstallPrompt = undefined;
    window.dispatchEvent(new Event(choice.outcome === "accepted" ? "personal-os-installed" : "personal-os-install-changed"));
  } catch {
    window.__personalOSInstallPrompt = undefined;
    window.dispatchEvent(new Event("personal-os-install-changed"));
  }
}

export default function PwaRegistration() {
  const [installed, setInstalled] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [platform] = useState<Platform>(() => typeof navigator === "undefined" ? "desktop" : currentPlatform());

  useEffect(() => {
    const syncInstallState = () => {
      const standalone = isStandaloneApp();
      setInstalled(standalone);
      setInstallable(Boolean(window.__personalOSInstallPrompt));
      if (standalone) {
        setBannerVisible(false);
        setHelpOpen(false);
      }
    };

    if ("serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(async (registration) => {
        await navigator.serviceWorker.ready;
        window.__personalOSPwaError = undefined;
        registration.update().catch(() => undefined);
        window.dispatchEvent(new Event("personal-os-pwa-ready"));
      }).catch((error: unknown) => {
        window.__personalOSPwaError = error instanceof Error ? error.message : "Service worker başlatılamadı";
        window.dispatchEvent(new Event("personal-os-pwa-error"));
      });
    } else if (!window.isSecureContext) {
      window.__personalOSPwaError = "PWA kurulumu güvenli HTTPS bağlantısı gerektiriyor";
      window.dispatchEvent(new Event("personal-os-pwa-error"));
    }

    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      window.__personalOSInstallPrompt = event as InstallPromptEvent;
      window.dispatchEvent(new Event("personal-os-install-ready"));
      setInstallable(true);
      setBannerVisible(true);
    };
    const markInstalled = () => {
      window.__personalOSInstallPrompt = undefined;
      setInstalled(true);
      setInstallable(false);
      setBannerVisible(false);
      setHelpOpen(false);
    };
    const onAppInstalled = () => {
      markInstalled();
      window.dispatchEvent(new Event("personal-os-installed"));
    };
    const requestInstall = () => {
      const prompt = window.__personalOSInstallPrompt;
      if (prompt) void showNativeInstallPrompt(prompt);
      else setHelpOpen(true);
    };

    syncInstallState();
    const bannerTimer = window.setTimeout(() => {
      if (!isStandaloneApp()) setBannerVisible(true);
    }, 900);
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    window.addEventListener("personal-os-install-request", requestInstall);
    window.addEventListener("personal-os-installed", markInstalled);
    window.addEventListener("personal-os-install-ready", syncInstallState);
    window.addEventListener("personal-os-install-changed", syncInstallState);
    if (window.__personalOSInstallPrompt) window.dispatchEvent(new Event("personal-os-install-ready"));
    return () => {
      window.clearTimeout(bannerTimer);
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener("personal-os-install-request", requestInstall);
      window.removeEventListener("personal-os-installed", markInstalled);
      window.removeEventListener("personal-os-install-ready", syncInstallState);
      window.removeEventListener("personal-os-install-changed", syncInstallState);
    };
  }, []);

  if (installed) return null;

  const steps = platform === "ios" ? [
    { icon: Share2, title: "Safari'de Paylaş'a dokun", detail: "Alt araç çubuğundaki paylaş simgesini aç." },
    { icon: Download, title: "Ana Ekrana Ekle", detail: "Listeden Ana Ekrana Ekle seçeneğini seç ve onayla." },
  ] : platform === "android" ? [
    { icon: ExternalLink, title: "Tam Chrome'da aç", detail: "Uygulama içi sekmedeysen ⋮ menüsünden Chrome'da aç seçeneğini kullan." },
    { icon: MoreVertical, title: "Chrome menüsünü aç", detail: "Uygulamayı yükle veya Ana ekrana ekle seçeneğine dokun." },
  ] : [
    { icon: ExternalLink, title: "Chrome veya Edge'de aç", detail: "Adres çubuğundaki uygulama yükleme simgesini kullan." },
    { icon: MoreVertical, title: "Tarayıcı menüsü", detail: "Uygulamayı yükle seçeneğini seç ve onayla." },
  ];

  const requestInstall = () => window.dispatchEvent(new Event("personal-os-install-request"));
  const helpText = platform === "ios"
    ? "iPhone ve iPad kurulumunu Safari'nin paylaşım menüsünden tamamlayabilirsin."
    : platform === "android"
      ? "Chrome kurulum seçeneğini göstermiyorsa sayfa uygulama içi bir sekmede açılmış olabilir."
      : "Masaüstünde Chrome veya Edge'in adres çubuğu ya da menüsü kurulum seçeneğini gösterir.";

  return <>
    {bannerVisible && !helpOpen && <aside className="os-pwa-install-banner" aria-label="Personal OS uygulamasını yükle">
      <span className="os-pwa-install-icon"><Download /></span>
      <span><strong>{"Personal OS'u yükle"}</strong><small>{installable ? "Uygulama olarak daha hızlı ve tam ekran kullan." : "Ana ekrandan tek dokunuşla, tam ekran aç."}</small></span>
      <button className="os-pwa-install-action" onClick={requestInstall}>{installable ? "Yükle" : "Nasıl?"}</button>
      <button className="os-pwa-install-close" onClick={() => setBannerVisible(false)} aria-label="Kurulum önerisini kapat"><X /></button>
    </aside>}
    {helpOpen && <div className="os-pwa-help-layer"><button className="os-pwa-help-scrim" onClick={() => setHelpOpen(false)} aria-label="Kurulum yardımını kapat" /><section className="os-pwa-help" role="dialog" aria-modal="true" aria-label="Personal OS uygulamasını yükle">
      <header><span><Smartphone /><i><small>UYGULAMAYI YÜKLE</small><strong>Personal OS uygulaması</strong></i></span><button onClick={() => setHelpOpen(false)} aria-label="Kurulum yardımını kapat"><X /></button></header>
      <p>{helpText}</p>
      <div>{steps.map(({ icon: Icon, title, detail }, index) => <article key={title}><b>{index + 1}</b><Icon /><span><strong>{title}</strong><small>{detail}</small></span></article>)}</div>
      <footer><button className="os-solid-button" onClick={() => setHelpOpen(false)}>Tamam</button></footer>
    </section></div>}
  </>;
}
