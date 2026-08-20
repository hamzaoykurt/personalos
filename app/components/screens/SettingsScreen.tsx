"use client";

import { CalendarDays, Database, Download, Moon, Save, SunMedium, Waves } from "lucide-react";
import type { PersonalOSState } from "@/lib/types";
import { ScreenHeader, SectionHead } from "./ScreenKit";

export default function SettingsScreen({ state, setState, syncState, theme, toggleTheme }: {
  state: PersonalOSState;
  setState: React.Dispatch<React.SetStateAction<PersonalOSState>>;
  syncState: "loading" | "saved" | "saving" | "offline";
  theme: "light" | "dark";
  toggleTheme: () => void;
}) {
  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `personal-os-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url);
  };
  return <div className="os-screen os-settings-screen"><ScreenHeader title="Ayarlar" kicker="SİSTEM" /><div className="os-settings-grid"><section className="os-inset-card"><SectionHead label="GÖRÜNÜM" title="Arayüz" /><button className="os-setting-row" onClick={toggleTheme}><span>{theme === "dark" ? <Moon /> : <SunMedium />}<i><strong>Tema</strong><small>Sistem tercihi ve elle seçim</small></i></span><b>{theme === "dark" ? "Koyu" : "Açık"}</b></button><button className="os-setting-row" onClick={() => setState((current) => ({ ...current, preferences: { ...current.preferences, reduceMotion: !current.preferences.reduceMotion } }))}><span><Waves /><i><strong>Hareket azaltma</strong><small>Geçiş ve basış animasyonlarını azalt</small></i></span><b>{state.preferences.reduceMotion ? "Açık" : "Kapalı"}</b></button><button className="os-setting-row" onClick={() => setState((current) => ({ ...current, preferences: { ...current.preferences, weekStart: current.preferences.weekStart === "monday" ? "sunday" : "monday" } }))}><span><CalendarDays /><i><strong>Hafta başlangıcı</strong><small>Takvim ve haftalık plan</small></i></span><b>{state.preferences.weekStart === "monday" ? "Pazartesi" : "Pazar"}</b></button></section><section className="os-inset-card"><SectionHead label="VERİ" title="Kayıt durumu" /><div className="os-setting-row"><span><Save /><i><strong>Kalıcı kayıt</strong><small>Platform veritabanı</small></i></span><b>{syncState === "saved" ? "Güncel" : syncState === "offline" ? "Çevrimdışı" : "Kaydediliyor"}</b></div><div className="os-setting-row"><span><Database /><i><strong>Toplam içerik</strong><small>{state.projects.length} proje · {state.tasks.length} görev · {state.notes.length} not</small></i></span><b>V2</b></div><button className="os-setting-row" onClick={exportData}><span><Download /><i><strong>Veriyi dışa aktar</strong><small>JSON yedeği indir</small></i></span><b>İndir</b></button></section></div></div>;
}
