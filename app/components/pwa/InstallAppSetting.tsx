"use client";

import { Download, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { isStandaloneApp } from "@/lib/pwa";

function isAppleMobile() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

function useInstallState() {
  const [installed, setInstalled] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [apple, setApple] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setInstalled(isStandaloneApp());
      setInstallable(Boolean(window.__personalOSInstallPrompt));
      setApple(isAppleMobile());
      setReady(!window.__personalOSPwaError);
    };
    sync();
    window.addEventListener("personal-os-install-ready", sync);
    window.addEventListener("personal-os-installed", sync);
    window.addEventListener("personal-os-pwa-ready", sync);
    window.addEventListener("personal-os-pwa-error", sync);
    return () => {
      window.removeEventListener("personal-os-install-ready", sync);
      window.removeEventListener("personal-os-installed", sync);
      window.removeEventListener("personal-os-pwa-ready", sync);
      window.removeEventListener("personal-os-pwa-error", sync);
    };
  }, []);

  return { installed, installable, apple, ready };
}

function requestInstall() {
  window.dispatchEvent(new Event("personal-os-install-request"));
}

export default function InstallAppSetting() {
  const { installed, installable, apple, ready } = useInstallState();

  if (installed) return <div className="os-setting-row"><span><Smartphone /><i><strong>Telefon uygulaması</strong><small>Personal OS bağımsız uygulama olarak çalışıyor</small></i></span><b>Yüklü</b></div>;

  if (installable) return <button className="os-setting-row" onClick={requestInstall}><span><Download /><i><strong>Telefona yükle</strong><small>Ana ekrandan tam ekran aç</small></i></span><b>Yükle</b></button>;

  return <button className="os-setting-row" onClick={requestInstall}><span><Smartphone /><i><strong>Telefona yükle</strong><small>{apple ? "Safari → Paylaş → Ana Ekrana Ekle" : ready ? "Chrome kurulum izni bekleniyor; kısayol ekleme" : "PWA hazırlanıyor"}</small></i></span><b>{apple ? "Adımlar" : "Kontrol"}</b></button>;
}

export function PwaInstallShortcut() {
  const { installed, installable, apple } = useInstallState();
  if (installed || (!installable && !apple)) return null;
  return <button className="os-pwa-shortcut" onClick={requestInstall}><Download /><span><strong>Uygulamayı yükle</strong><small>{installable ? "Chrome tarafından doğrulandı" : "Safari kurulum adımlarını aç"}</small></span></button>;
}
