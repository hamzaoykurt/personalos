"use client";

import { Archive, Check, ChevronRight, Circle, Clock3, Compass, ExternalLink, ListChecks, RotateCcw, ShoppingBag, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { PersonalOSState, Task, TaskCategory } from "@/lib/types";
import { cx, EmptyView, formatDate, ScreenHeader, todayIso } from "./ScreenKit";

const categoryInfo: Record<TaskCategory, { label: string; title: string; icon: typeof ListChecks }> = {
  todo: { label: "Yapılacak", title: "Net sonraki adımlar", icon: ListChecks },
  purchase: { label: "Alınacak", title: "Satın alma listesi", icon: ShoppingBag },
  place: { label: "Gezilecek", title: "Yerler ve deneyimler", icon: Compass },
};

export default function TasksScreen({ state, setState, openCapture }: {
  state: PersonalOSState;
  setState: React.Dispatch<React.SetStateAction<PersonalOSState>>;
  openCapture: (category: TaskCategory) => void;
}) {
  const [category, setCategory] = useState<TaskCategory>("todo");
  const [filter, setFilter] = useState<"open" | "done" | "all">("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = state.tasks.find((task) => task.id === selectedId) ?? null;
  const visible = useMemo(() => state.tasks.filter((task) => task.category === category && (filter === "all" || (filter === "done" ? task.completed : !task.completed))), [state.tasks, category, filter]);

  const updateTask = (id: string, updates: Partial<Task>) => setState((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task) }));
  const toggleTask = (task: Task) => updateTask(task.id, { completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : undefined });
  const removeTask = (id: string) => {
    setState((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id), calendarItems: current.calendarItems.filter((item) => item.id !== id && item.title !== selected?.title) }));
    setSelectedId(null);
  };

  return <div className="os-screen os-tasks-screen">
    <ScreenHeader title="Görevler" kicker="GÜNLÜK OPERASYON" action={`${categoryInfo[category].label} ekle`} onAction={() => openCapture(category)} />

    <div className="os-category-switch">{(Object.keys(categoryInfo) as TaskCategory[]).map((key) => {
      const Icon = categoryInfo[key].icon;
      const count = state.tasks.filter((task) => task.category === key && !task.completed).length;
      return <button className={category === key ? "is-active" : ""} key={key} onClick={() => { setCategory(key); setSelectedId(null); }}><Icon /><span>{categoryInfo[key].label}</span><b>{count}</b></button>;
    })}</div>

    <section className="os-inset-card os-task-panel">
      <div className="os-list-toolbar"><h2>{categoryInfo[category].title}</h2><div className="os-filter-switch">{(["open", "done", "all"] as const).map((value) => <button className={filter === value ? "is-active" : ""} key={value} onClick={() => setFilter(value)}>{value === "open" ? "Açık" : value === "done" ? "Biten" : "Tümü"}</button>)}</div></div>
      <div className="os-task-list">{visible.map((task) => {
        const project = state.projects.find((item) => item.id === task.projectId);
        const context = task.category === "purchase" ? task.estimate : task.category === "place" ? [task.city, task.placeType].filter(Boolean).join(" · ") : project?.title ?? task.recurrence;
        return <article className={cx("os-task-row", task.completed && "is-complete")} key={task.id}>
          <button className="os-check" onClick={() => toggleTask(task)} aria-label={task.completed ? `${task.title} görevini aç` : `${task.title} görevini tamamla`}>{task.completed ? <Check /> : <Circle />}</button>
          <button className="os-task-body" onClick={() => setSelectedId(task.id)}><strong>{task.title}</strong>{context && <small>{context}</small>}</button>
          <span className="os-task-when">{task.time || (task.date ? formatDate(task.date) : "")}</span>
          <button className="os-row-open" onClick={() => setSelectedId(task.id)} aria-label={`${task.title} ayrıntıları`}><ChevronRight /></button>
        </article>;
      })}{!visible.length && <EmptyView icon={categoryInfo[category].icon} title={filter === "open" ? "Liste temiz" : "Kayıt bulunamadı"} action="Yeni kayıt" onAction={() => openCapture(category)} />}</div>
    </section>

    {selected && <div className="os-sheet-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedId(null)}>
      <aside className="os-detail-sheet" role="dialog" aria-modal="true" aria-label={`${selected.title} ayrıntıları`}>
        <header><span>{categoryInfo[selected.category].label}</span><button onClick={() => setSelectedId(null)} aria-label="Ayrıntıyı kapat"><X /></button></header>
        <input className="os-detail-title" value={selected.title} onChange={(event) => updateTask(selected.id, { title: event.target.value })} aria-label="Başlık" />
        <div className="os-detail-actions">
          <button onClick={() => toggleTask(selected)}>{selected.completed ? <RotateCcw /> : <Check />}{selected.completed ? "Geri aç" : "Tamamla"}</button>
          <button onClick={() => updateTask(selected.id, { date: todayIso(1), deferredUntil: todayIso(1) })}><Clock3 />Yarına al</button>
          <button className="is-danger" onClick={() => removeTask(selected.id)}><Trash2 />Sil</button>
        </div>
        <div className="os-form-grid">
          <label><span>Tarih</span><input type="date" value={selected.date ?? ""} onChange={(event) => updateTask(selected.id, { date: event.target.value })} /></label>
          {selected.category === "todo" && <label><span>Saat</span><input type="time" value={selected.time ?? ""} onChange={(event) => updateTask(selected.id, { time: event.target.value })} /></label>}
          <label><span>Öncelik</span><select value={selected.priority} onChange={(event) => updateTask(selected.id, { priority: event.target.value as Task["priority"] })}><option value="low">Düşük</option><option value="medium">Normal</option><option value="high">Yüksek</option></select></label>
          {selected.category === "todo" && <label><span>Proje</span><select value={selected.projectId ?? ""} onChange={(event) => updateTask(selected.id, { projectId: event.target.value || undefined })}><option value="">Proje yok</option>{state.projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>}
          {selected.category === "purchase" && <><label><span>Tahmini fiyat</span><input value={selected.estimate ?? ""} onChange={(event) => updateTask(selected.id, { estimate: event.target.value })} placeholder="₺0" /></label><label><span>Bağlantı</span><input value={selected.link ?? ""} onChange={(event) => updateTask(selected.id, { link: event.target.value })} /></label></>}
          {selected.category === "place" && <><label><span>Şehir</span><input value={selected.city ?? ""} onChange={(event) => updateTask(selected.id, { city: event.target.value })} /></label><label><span>Yer türü</span><input value={selected.placeType ?? ""} onChange={(event) => updateTask(selected.id, { placeType: event.target.value })} /></label></>}
        </div>
        <label className="os-detail-notes"><span>Not</span><textarea value={selected.notes ?? ""} onChange={(event) => updateTask(selected.id, { notes: event.target.value })} placeholder="Yalnızca gerekli bağlam…" /></label>
        <div className="os-subtask-list">{selected.subtasks.map((subtask) => <button key={subtask.id} onClick={() => updateTask(selected.id, { subtasks: selected.subtasks.map((item) => item.id === subtask.id ? { ...item, completed: !item.completed } : item) })}>{subtask.completed ? <Check /> : <Circle />}{subtask.title}</button>)}</div>
        {selected.link && <a className="os-external-link" href={selected.link.startsWith("http") ? selected.link : undefined} target="_blank" rel="noreferrer"><ExternalLink />Bağlantıyı aç</a>}
        <footer><Archive />Değişiklikler otomatik kaydedilir</footer>
      </aside>
    </div>}
  </div>;
}
