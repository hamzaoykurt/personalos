"use client";

import { useEffect } from "react";
import type { InstallPromptEvent } from "@/lib/pwa";

export default function PwaRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }

    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      window.__personalOSInstallPrompt = event as InstallPromptEvent;
      window.dispatchEvent(new Event("personal-os-install-ready"));
    };
    const clearInstallPrompt = () => {
      window.__personalOSInstallPrompt = undefined;
      window.dispatchEvent(new Event("personal-os-installed"));
    };

    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", clearInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", clearInstallPrompt);
    };
  }, []);

  return null;
}
