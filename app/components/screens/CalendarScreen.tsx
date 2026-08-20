"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { CalendarItem, PersonalOSState } from "@/lib/types";
import { cx, EmptyView, formatDate, ScreenHeader, todayIso, uid } from "./ScreenKit";

const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function CalendarScreen({ state, setState, openCapture }: {
  state: PersonalOSState;
  setState: React.Dispatch<React.SetStateAction<PersonalOSState>>;
  openCapture: () => void;
}) {
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newType, setNewType] = useState<CalendarItem["type"]>("personal");

  const allItems = useMemo(() => {
    const items = [...state.calendarItems];
    const fingerprints = new Set(items.map((item) => `${item.date}|${item.title}`));
    state.tasks.filter((task) => task.date && !task.completed).forEach((task) => {
      const key = `${task.date}|${task.title}`;
      if (!fingerprints.has(key)) items.push({ id: `task-${task.id}`, title: task.title, date: task.date!, time: task.time, type: "task" });
    });
    state.projects.filter((project) => project.dueDate && project.status !== "done").forEach((project) => {
      const key = `${project.dueDate}|${project.title}`;
      if (!fingerprints.has(key)) items.push({ id: `project-${project.id}`, title: project.title, date: project.dueDate!, type: "project" });
    });
    state.workNotes.filter((note) => note.date && note.status !== "Tamamlandı").forEach((note) => {
      const key = `${note.date}|${note.title}`;
      if (!fingerprints.has(key)) items.push({ id: `work-${note.id}`, title: note.title, date: note.date, type: "work" });
    });
    return items;
  }, [state]);

  const monthCells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      return { date, iso, currentMonth: date.getMonth() === cursor.getMonth() };
    });
  }, [cursor]);

  const weekDays = useMemo(() => {
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => {
      const current = new Date(date);
      current.setDate(date.getDate() + index);
      return { iso: current.toISOString().slice(0, 10), date: current };
    });
  }, [selectedDate]);

  const selectedItems = allItems.filter((item) => item.date === selectedDate).sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));
  const selectToday = () => { const now = new Date(); setCursor(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDate(todayIso()); };
  const addItem = (event: FormEvent) => {
    event.preventDefault();
    if (!newTitle.trim()) return;
    setState((current) => ({ ...current, calendarItems: [{ id: uid("cal"), title: newTitle.trim(), date: selectedDate, time: newTime || undefined, type: newType }, ...current.calendarItems] }));
    setNewTitle(""); setNewTime("");
  };

  return <div className="os-screen os-calendar-screen">
    <ScreenHeader title="Takvim" kicker="ORTAK AJANDA" action="Görev ekle" onAction={openCapture} aside={<button className="os-quiet-button" onClick={selectToday}>Bugün</button>} />

    <div className="os-week-strip">{weekDays.map((day, index) => <button key={day.iso} className={cx(day.iso === selectedDate && "is-active", day.iso === todayIso() && "is-today")} onClick={() => setSelectedDate(day.iso)}><span>{dayNames[index]}</span><strong>{day.date.getDate()}</strong><i>{allItems.filter((item) => item.date === day.iso).length || ""}</i></button>)}</div>

    <div className="os-calendar-layout">
      <section className="os-inset-card os-month-panel">
        <header><h2>{monthNames[cursor.getMonth()]} <span>{cursor.getFullYear()}</span></h2><div><button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="Önceki ay"><ChevronLeft /></button><button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="Sonraki ay"><ChevronRight /></button></div></header>
        <div className="os-month-weekdays">{dayNames.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="os-month-grid">{monthCells.map((cell) => {
          const items = allItems.filter((item) => item.date === cell.iso);
          return <button key={cell.iso} className={cx(!cell.currentMonth && "is-other", cell.iso === selectedDate && "is-selected", cell.iso === todayIso() && "is-today")} onClick={() => setSelectedDate(cell.iso)}><b>{cell.date.getDate()}</b><span>{items.slice(0, 2).map((item) => <i className={`is-${item.type}`} key={item.id} title={item.title} />)}</span>{items.length > 2 && <small>+{items.length - 2}</small>}</button>;
        })}</div>
      </section>

      <aside className="os-inset-card os-agenda-panel">
        <header><span>SEÇİLİ GÜN</span><h2>{formatDate(selectedDate, { weekday: "long", day: "numeric", month: "long" })}</h2></header>
        <div className="os-agenda-list">{selectedItems.map((item) => <article className={`is-${item.type}`} key={item.id}><i /><span>{item.time ?? "Gün boyu"}</span><strong>{item.title}</strong><small>{item.type === "work" ? "İş" : item.type === "project" ? "Proje" : item.type === "event" ? "Etkinlik" : item.type === "task" ? "Görev" : "Kişisel"}</small></article>)}{!selectedItems.length && <EmptyView icon={CalendarDays} title="Bu gün açık" />}</div>
        <form className="os-agenda-add" onSubmit={addItem}><input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Bu güne ekle…" aria-label="Etkinlik başlığı" /><div><label><Clock3 /><input type="time" value={newTime} onChange={(event) => setNewTime(event.target.value)} aria-label="Saat" /></label><select value={newType} onChange={(event) => setNewType(event.target.value as CalendarItem["type"])} aria-label="Kayıt türü"><option value="personal">Kişisel</option><option value="event">Etkinlik</option><option value="work">İş</option><option value="project">Proje</option></select><button aria-label="Takvime ekle"><Plus /></button></div></form>
      </aside>
    </div>
  </div>;
}
