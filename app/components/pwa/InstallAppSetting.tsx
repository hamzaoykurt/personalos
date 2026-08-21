"use client";

import { Download, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { isStandaloneApp } from "@/lib/pwa";

function isAppleMobile() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallAppSetting() {
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

  const install = async () => {
    const prompt = window.__personalOSInstallPrompt;
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") {
      window.__personalOSInstallPrompt = undefined;
      setInstallable(false);
    }
  };

  if (installed) return <div className="os-setting-row"><span><Smartphone /><i><strong>Telefon uygulaması</strong><small>Personal OS bağımsız uygulama olarak çalışıyor</small></i></span><b>Yüklü</b></div>;

  if (installable) return <button className="os-setting-row" onClick={install}><span><Download /><i><strong>Telefona yükle</strong><small>Ana ekrandan tam ekran aç</small></i></span><b>Yükle</b></button>;

  return <div className="os-setting-row"><span><Smartphone /><i><strong>Telefona yükle</strong><small>{apple ? "Paylaş → Ana Ekrana Ekle" : "Tarayıcı menüsü → Uygulamayı yükle"}</small></i></span><b>Hazır</b></div>;
}
