"use client";

import { ArrowRight, BookOpen, BriefcaseBusiness, CalendarDays, ClipboardCheck, Dumbbell, FileText, Mic2, Orbit, Rocket, Search, Sparkles, Telescope, X, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CaptureType, Section } from "@/lib/navigation";
import type { PersonalOSState } from "@/lib/types";

type Result = { id: string; type: string; title: string; detail: string; action: () => void };

export default function CommandPalette({ state, close, go, capture, openProject, openRebuildArea }: { state: PersonalOSState; close: () => void; go: (section: Section) => void; capture: (type: CaptureType) => void; openProject: (id: string) => void; openRebuildArea: (area: string) => void }) {
  const [query, setQuery] = useState(""); const [activeIndex, setActiveIndex] = useState(0); const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const openSection = (section: Section) => { close(); go(section); };
  const commands: Array<{ id: string; title: string; detail: string; icon: LucideIcon; action: () => void }> = [
    { id: "new-task", title: "Yeni görev", detail: "Yapılacak, alınacak veya gezilecek", icon: ClipboardCheck, action: () => capture("task") },
    { id: "new-note", title: "Yeni not", detail: "Gelen kutusuna not", icon: FileText, action: () => capture("note") },
    { id: "new-project", title: "Yeni proje", detail: "İlk somut adımla başlat", icon: Orbit, action: () => capture("project") },
    { id: "new-work", title: "İş notu ekle", detail: "Kıbleteyn çalışma alanı", icon: BriefcaseBusiness, action: () => capture("work") },
    { id: "calendar", title: "Takvimi aç", detail: "Ortak ajanda", icon: CalendarDays, action: () => openSection("calendar") },
    { id: "rebuild", title: "Rebuild'i aç", detail: "Bu haftanın ritmi", icon: Rocket, action: () => openSection("career") },
    { id: "voice", title: "Ses kaydı başlat", detail: "Rebuild · Diksiyon", icon: Mic2, action: () => { close(); openRebuildArea("diction"); } },
    { id: "workout", title: "Spor kaydet", detail: "Rebuild · Beden", icon: Dumbbell, action: () => { close(); openRebuildArea("body"); } },
    { id: "curiosity", title: "Merak görevi başlat", detail: "Curiosity Deck", icon: Telescope, action: () => { close(); openRebuildArea("curiosity"); } },
    { id: "creative", title: "Yaratıcı oturum başlat", detail: "Creative Deck", icon: Sparkles, action: () => { close(); openRebuildArea("creative"); } },
  ];
  const normalized = query.trim().toLocaleLowerCase("tr-TR");
  const results = useMemo<Result[]>(() => {
    if (!normalized) return commands.map((command) => ({ id: command.id, type: "KOMUT", title: command.title, detail: command.detail, action: command.action }));
    return [
      ...commands.filter((command) => `${command.title} ${command.detail}`.toLocaleLowerCase("tr-TR").includes(normalized)).map((command) => ({ id: command.id, type: "KOMUT", title: command.title, detail: command.detail, action: command.action })),
      ...state.projects.filter((item) => `${item.title} ${item.category} ${item.nextAction}`.toLocaleLowerCase("tr-TR").includes(normalized)).map((item) => ({ id: item.id, type: "PROJE", title: item.title, detail: item.nextAction, action: () => { close(); go("projects"); openProject(item.id); } })),
      ...state.tasks.filter((item) => `${item.title} ${item.notes ?? ""} ${item.city ?? ""}`.toLocaleLowerCase("tr-TR").includes(normalized)).map((item) => ({ id: item.id, type: item.category === "place" ? "YER" : item.category === "purchase" ? "ALINACAK" : "GÖREV", title: item.title, detail: item.city ?? item.estimate ?? item.date ?? "Tarihsiz", action: () => openSection("tasks") })),
      ...state.notes.filter((item) => `${item.title} ${item.content} ${item.tags.join(" ")}`.toLocaleLowerCase("tr-TR").includes(normalized)).map((item) => ({ id: item.id, type: "NOT", title: item.title, detail: item.folder, action: () => openSection("notes") })),
      ...state.workNotes.filter((item) => `${item.title} ${item.description}`.toLocaleLowerCase("tr-TR").includes(normalized)).map((item) => ({ id: item.id, type: "İŞ", title: item.title, detail: item.workspace, action: () => openSection("work") })),
      ...state.curiosityQuestions.filter((item) => item.question.toLocaleLowerCase("tr-TR").includes(normalized)).map((item) => ({ id: item.id, type: "MERAK", title: item.question, detail: item.category, action: () => openSection("career") })),
    ].slice(0,12);
  // commands are stable for the lifetime of this render and all actions intentionally use current callbacks.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized, state]);
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => { if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((value) => Math.min(value + 1, results.length - 1)); } if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((value) => Math.max(value - 1, 0)); } if (event.key === "Enter" && results[activeIndex]) { event.preventDefault(); results[activeIndex].action(); } };
  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
  return <div className="os-command-layer" onMouseDown={(event) => event.target === event.currentTarget && close()}><section className="os-command-palette" role="dialog" aria-modal="true" aria-label="Global arama"><header><Search /><input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={onKeyDown} placeholder="Ara veya komut yaz…" /><button onClick={close} aria-label="Aramayı kapat"><X /></button></header><span className="os-command-label">{normalized ? "ARAMA SONUÇLARI" : "HIZLI KOMUTLAR"}</span><div>{results.map((result,index) => <button className={activeIndex === index ? "is-active" : ""} key={`${result.type}-${result.id}`} onMouseEnter={() => setActiveIndex(index)} onClick={result.action}><span>{result.type}</span><i><strong>{result.title}</strong><small>{result.detail}</small></i><ArrowRight /></button>)}{!results.length && <p><BookOpen />Sonuç bulunamadı</p>}</div><footer><span><kbd>↑</kbd><kbd>↓</kbd> gezin</span><span><kbd>↵</kbd> aç</span><span><kbd>ESC</kbd> kapat</span></footer></section></div>;
}
