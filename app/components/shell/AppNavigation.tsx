"use client";

import { Archive, BookOpen, BriefcaseBusiness, CalendarDays, ClipboardCheck, Menu, Mic2, Moon, Orbit, Plus, Radar, Rocket, Search, Settings, SunMedium, X, type LucideIcon } from "lucide-react";
import type { Section } from "@/lib/navigation";
import { sectionPaths } from "@/lib/navigation";
import { cx } from "../screens/ScreenKit";

type Theme = "light" | "dark";
type SyncState = "loading" | "saved" | "saving" | "offline";
type NavItem = { id: Section; label: string; icon: LucideIcon };

const groups: Array<{ label: string; items: NavItem[] }> = [
  { label: "BUGÜN", items: [{ id: "home", label: "Ana merkez", icon: Radar }, { id: "tasks", label: "Görevler", icon: ClipboardCheck }, { id: "calendar", label: "Takvim", icon: CalendarDays }] },
  { label: "ÜRET", items: [{ id: "projects", label: "Projeler", icon: Orbit }, { id: "work", label: "Kıbleteyn", icon: BriefcaseBusiness }, { id: "notes", label: "Notlar", icon: BookOpen }] },
  { label: "GELİŞ", items: [{ id: "career", label: "Rebuild", icon: Rocket }] },
];

export function Sidebar({ active, open, go, close, capture, openVoiceRecorder, theme, toggleTheme, syncState }: { active: Section; open: boolean; go: (section: Section) => void; close: () => void; capture: () => void; openVoiceRecorder: () => void; theme: Theme; toggleTheme: () => void; syncState: SyncState }) {
  const render = (item: NavItem) => { const Icon = item.icon; return <a key={item.id} href={sectionPaths[item.id]} className={cx("os-nav-link", active === item.id && "is-active")} aria-current={active === item.id ? "page" : undefined} onClick={(event) => { event.preventDefault(); go(item.id); }}><span><Icon /></span><strong>{item.label}</strong>{active === item.id && <i />}</a>; };
  return <aside className={cx("os-sidebar", open && "is-open")}>
    <header><div className="os-brand-mark"><Orbit /><i /></div><div><strong>PERSONAL OS</strong><span>YAŞA · MERAK ET · ÜRET</span></div><button onClick={close} aria-label="Menüyü kapat"><X /></button></header>
    <button className="os-sidebar-capture" onClick={capture}><Plus /><span><strong>Hızlı yakala</strong><small>Aklındakini kaydet</small></span></button>
    <nav aria-label="Ana navigasyon">{groups.map((group) => <section key={group.label}><span>{group.label}</span>{group.items.map(render)}{group.label === "GELİŞ" && <button className="os-voice-shortcut" onClick={openVoiceRecorder}><Mic2 /><span><strong>Ses kaydı</strong><small>Diksiyon oturumu</small></span></button>}</section>)}</nav>
    <footer><div className="os-phase-card"><span>AKTİF FAZ</span><strong>REACTIVATION</strong><i><b style={{ width: "34%" }} /></i><small>AY 1 / 6</small></div><div className="os-sidebar-utilities">{render({ id: "archive", label: "Arşiv", icon: Archive })}{render({ id: "settings", label: "Ayarlar", icon: Settings })}<button className="os-nav-link" onClick={toggleTheme}><span>{theme === "dark" ? <SunMedium /> : <Moon />}</span><strong>{theme === "dark" ? "Açık tema" : "Koyu tema"}</strong></button></div><div className={cx("os-sync-chip", `is-${syncState}`)}><i /><span>{syncState === "saved" ? "Kaydedildi" : syncState === "offline" ? "Çevrimdışı" : syncState === "saving" ? "Kaydediliyor" : "Yükleniyor"}</span></div></footer>
  </aside>;
}

export function TopBar({ title, menu, search, capture }: { title: string; menu: () => void; search: () => void; capture: () => void }) {
  return <header className="os-topbar"><button onClick={menu} aria-label="Menüyü aç"><Menu /></button><strong>{title}</strong><div><button className="os-search-button" onClick={search}><Search /><span>Her yerde ara</span><kbd>⌘K</kbd></button><button className="os-top-capture" onClick={capture}><Plus /><span>Yeni kayıt</span></button></div></header>;
}

export function MobileNavigation({ active, go, capture }: { active: Section; go: (section: Section) => void; capture: () => void }) {
  const items: NavItem[] = [{ id: "home", label: "Ana", icon: Radar }, { id: "projects", label: "Projeler", icon: Orbit }, { id: "tasks", label: "Görevler", icon: ClipboardCheck }, { id: "notes", label: "Notlar", icon: BookOpen }];
  return <nav className="os-mobile-nav" aria-label="Mobil navigasyon">{items.slice(0,2).map((item) => { const Icon = item.icon; return <button className={active === item.id ? "is-active" : ""} key={item.id} onClick={() => go(item.id)}><Icon /><span>{item.label}</span></button>; })}<button className="os-mobile-capture" onClick={capture} aria-label="Yeni kayıt"><i><Plus /></i><span>Ekle</span></button>{items.slice(2).map((item) => { const Icon = item.icon; return <button className={active === item.id ? "is-active" : ""} key={item.id} onClick={() => go(item.id)}><Icon /><span>{item.label}</span></button>; })}</nav>;
}
