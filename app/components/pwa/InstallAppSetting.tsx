"use client";

import { Download, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { isStandaloneApp } from "@/lib/pwa";

function isAppleMobile() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function useInstallState() {
  const [installed, setInstalled] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [apple, setApple] = useState(false);

  useEffect(() => {
    const sync = () => {
      setInstalled(isStandaloneApp());
      setInstallable(Boolean(window.__personalOSInstallPrompt));
      setApple(isAppleMobile());
    };
    sync();
    window.addEventListener("personal-os-install-ready", sync);
    window.addEventListener("personal-os-installed", sync);
    return () => {
      window.removeEventListener("personal-os-install-ready", sync);
      window.removeEventListener("personal-os-installed", sync);
    };
  }, []);

  return { installed, installable, apple };
}

function requestInstall() {
  window.dispatchEvent(new Event("personal-os-install-request"));
}

export default function InstallAppSetting() {
  const { installed, installable, apple } = useInstallState();

  if (installed) return <div className="os-setting-row"><span><Smartphone /><i><strong>Telefon uygulaması</strong><small>Personal OS bağımsız uygulama olarak çalışıyor</small></i></span><b>Yüklü</b></div>;

  if (installable) return <button className="os-setting-row" onClick={requestInstall}><span><Download /><i><strong>Telefona yükle</strong><small>Ana ekrandan tam ekran aç</small></i></span><b>Yükle</b></button>;

  return <button className="os-setting-row" onClick={requestInstall}><span><Smartphone /><i><strong>Telefona yükle</strong><small>{apple ? "Safari → Paylaş → Ana Ekrana Ekle" : "Tam Chrome'da açıp uygulamayı yükle"}</small></i></span><b>Nasıl?</b></button>;
}

export function PwaInstallShortcut() {
  const { installed, installable } = useInstallState();
  if (installed) return null;
  return <button className="os-pwa-shortcut" onClick={requestInstall}><Download /><span><strong>Uygulamayı yükle</strong><small>{installable ? "Tek dokunuşla hazır" : "Ana ekranda tam ekran aç"}</small></span></button>;
}
