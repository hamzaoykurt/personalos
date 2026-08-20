"use client";

import { BriefcaseBusiness, Check, FileText, Lightbulb, ListChecks, Orbit, Plus, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { CaptureType } from "@/lib/navigation";
import type { Note, PersonalOSState, Priority, Project, Task, TaskCategory, WorkNote } from "@/lib/types";
import { todayIso, uid } from "../screens/ScreenKit";

type Destination = CaptureType | "purchase" | "place";
type OrganizedItem = { id: string; title: string; destination: Destination };

const typeMeta: Array<{ id: CaptureType; label: string; icon: typeof ListChecks }> = [
  { id: "task", label: "Görev", icon: ListChecks }, { id: "note", label: "Not", icon: FileText }, { id: "project", label: "Proje", icon: Orbit }, { id: "work", label: "İş", icon: BriefcaseBusiness }, { id: "research", label: "Araştırma", icon: Lightbulb },
];
const destinationLabels: Record<Destination, string> = { task: "Yapılacak", purchase: "Alınacak", place: "Gezilecek", note: "Not", project: "Proje", work: "İş", research: "Araştırma" };

function inferDestination(value: string): Destination {
  const text = value.toLocaleLowerCase("tr-TR");
  if (/(satın|alınacak|sipariş|fiyat|alışveriş)/.test(text)) return "purchase";
  if (/(gez|git|müze|kafe|sergi|sahil|rota|semt)/.test(text)) return "place";
  if (/(araştır|öğren|neden|nasıl|merak|\?)/.test(text)) return "research";
  if (/(proje|uygulama|site|ürün)/.test(text)) return "project";
  if (/(müşteri|teslim|toplantı|iş|rapor|mail)/.test(text)) return "work";
  if (/(not|fikir|düşünce)/.test(text)) return "note";
  return "task";
}

export default function CaptureSheet({ initialType, initialMode, initialTaskCategory, initialWorkspace, state, setState, close }: {
  initialType: CaptureType;
  initialMode: "single" | "organize";
  initialTaskCategory: TaskCategory;
  initialWorkspace: WorkNote["workspace"];
  state: PersonalOSState;
  setState: React.Dispatch<React.SetStateAction<PersonalOSState>>;
  close: () => void;
}) {
  const [type, setType] = useState(initialType);
  const [mode, setMode] = useState(initialMode);
  const [taskCategory, setTaskCategory] = useState(initialTaskCategory);
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [title, setTitle] = useState(""); const [detail, setDetail] = useState(""); const [date, setDate] = useState(todayIso()); const [time, setTime] = useState(""); const [priority, setPriority] = useState<Priority>("medium"); const [projectId, setProjectId] = useState("");
  const [estimate, setEstimate] = useState(""); const [link, setLink] = useState(""); const [city, setCity] = useState(""); const [placeType, setPlaceType] = useState("");
  const [brainDump, setBrainDump] = useState(""); const [organized, setOrganized] = useState<OrganizedItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (mode === "single") inputRef.current?.focus(); }, [mode]);

  const prepare = () => setOrganized(brainDump.replace(/\r/g, "\n").replace(/([.!?])\s+/g, "$1\n").split(/\n+|;/).map((item) => item.trim()).filter((item) => item.length > 2).slice(0,20).map((item) => ({ id: uid("organized"), title: item, destination: inferDestination(item) })));

  const persist = (items: OrganizedItem[]) => setState((current) => {
    const tasks: Task[] = []; const projects: Project[] = []; const notes: Note[] = []; const workNotes: WorkNote[] = [];
    items.forEach((item) => {
      if (["task","purchase","place"].includes(item.destination)) tasks.push({ id: uid("task"), title: item.title, category: item.destination === "purchase" ? "purchase" : item.destination === "place" ? "place" : "todo", completed: false, priority: "medium", date, subtasks: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      if (item.destination === "project") projects.push({ id: uid("project"), title: item.title.toUpperCase(), category: "GELEN KUTUSU", description: "Hızlı yakalamadan oluşturuldu.", status: "backlog", priority: "medium", startDate: todayIso(), progress: 0, tags: ["yakalanan"], nextAction: "İlk net adımı tanımla", subtasks: [], activity: [{ id: uid("activity"), type: "created", label: "Hızlı yakalamadan oluşturuldu", at: new Date().toISOString() }] });
      if (item.destination === "note" || item.destination === "research") notes.push({ id: uid("note"), title: item.title, folder: item.destination === "research" ? "ARAŞTIRMA / Gelen Kutusu" : "GELEN KUTUSU", content: item.title, tags: item.destination === "research" ? ["araştırma"] : [], favorite: false, archived: false, updatedAt: todayIso() });
      if (item.destination === "work") workNotes.push({ id: uid("work"), title: item.title, workspace: "GENEL", description: "", status: "Bekliyor", priority: "medium", date, checklist: [] });
    });
    return { ...current, tasks: [...tasks, ...current.tasks], projects: [...projects, ...current.projects], notes: [...notes, ...current.notes], workNotes: [...workNotes, ...current.workNotes] };
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === "organize") { if (!organized.length) return; persist(organized); close(); return; }
    if (!title.trim()) return;
    if (type === "task") {
      const task: Task = { id: uid("task"), title: title.trim(), category: taskCategory, completed: false, priority, date, time: time || undefined, notes: detail || undefined, projectId: taskCategory === "todo" ? projectId || undefined : undefined, estimate: taskCategory === "purchase" ? estimate || undefined : undefined, link: taskCategory === "purchase" ? link || undefined : undefined, city: taskCategory === "place" ? city || undefined : undefined, placeType: taskCategory === "place" ? placeType || undefined : undefined, subtasks: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      setState((current) => ({ ...current, tasks: [task, ...current.tasks], calendarItems: taskCategory === "todo" ? [{ id: uid("cal"), title: task.title, date, time: time || undefined, type: projectId ? "project" : "task" }, ...current.calendarItems] : current.calendarItems }));
    }
    if (type === "project") setState((current) => ({ ...current, projects: [{ id: uid("project"), title: title.trim().toUpperCase(), category: "YENİ PROJE", description: detail, status: "backlog", priority, startDate: todayIso(), dueDate: date || undefined, progress: 0, tags: [], nextAction: "İlk somut adımı tanımla", subtasks: [], activity: [{ id: uid("activity"), type: "created", label: "Proje oluşturuldu", at: new Date().toISOString() }] }, ...current.projects] }));
    if (type === "note" || type === "research") setState((current) => ({ ...current, notes: [{ id: uid("note"), title: title.trim(), folder: type === "research" ? "ARAŞTIRMA / Gelen Kutusu" : "GELEN KUTUSU", content: detail, tags: type === "research" ? ["araştırma"] : [], favorite: false, archived: false, updatedAt: todayIso() }, ...current.notes] }));
    if (type === "work") setState((current) => ({ ...current, workNotes: [{ id: uid("work"), title: title.trim(), workspace, description: detail, status: "Bekliyor", priority, date, checklist: [] }, ...current.workNotes] }));
    close();
  };

  const titlePlaceholder = type === "task" ? taskCategory === "purchase" ? "Ne alınacak?" : taskCategory === "place" ? "Nereye gitmek istiyorsun?" : "Ne yapılacak?" : type === "project" ? "Projenin adı" : type === "work" ? "İşin başlığı" : type === "research" ? "Neyi merak ediyorsun?" : "Notun başlığı";
  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
  return <div className="os-sheet-layer os-capture-layer" onMouseDown={(event) => event.target === event.currentTarget && close()}><form className="os-capture-sheet" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Yeni kayıt">
    <header><div><span>HIZLI YAKALA</span><h2>{mode === "single" ? "Yeni kayıt" : "Düzenle ve dağıt"}</h2></div><button type="button" onClick={close} aria-label="Yeni kaydı kapat"><X /></button></header>
    <div className="os-capture-mode"><button type="button" className={mode === "single" ? "is-active" : ""} onClick={() => setMode("single")}><Plus />Tek kayıt</button><button type="button" className={mode === "organize" ? "is-active" : ""} onClick={() => setMode("organize")}><Sparkles />Toplu ayır</button></div>
    {mode === "single" ? <>
      <div className="os-capture-types">{typeMeta.map((item) => { const Icon = item.icon; return <button type="button" className={type === item.id ? "is-active" : ""} key={item.id} onClick={() => setType(item.id)}><Icon /><span>{item.label}</span></button>; })}</div>
      {type === "task" && <div className="os-context-switch">{(["todo","purchase","place"] as TaskCategory[]).map((item) => <button type="button" className={taskCategory === item ? "is-active" : ""} key={item} onClick={() => setTaskCategory(item)}>{item === "todo" ? "Yapılacak" : item === "purchase" ? "Alınacak" : "Gezilecek"}</button>)}</div>}
      <label><span>Başlık</span><input ref={inputRef} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={titlePlaceholder} /></label>
      <label><span>Not</span><textarea value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="Yalnızca gerekli bağlam…" /></label>
      <div className="os-capture-grid">{["task","project","work"].includes(type) && <label><span>Tarih</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>}{["task","project","work"].includes(type) && <label><span>Öncelik</span><select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option value="low">Düşük</option><option value="medium">Normal</option><option value="high">Yüksek</option></select></label>}{type === "task" && taskCategory === "todo" && <><label><span>Saat</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label><label><span>Proje</span><select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">Proje yok</option>{state.projects.filter((item) => item.status !== "done").map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label></>}{type === "task" && taskCategory === "purchase" && <><label><span>Tahmini fiyat</span><input value={estimate} onChange={(event) => setEstimate(event.target.value)} placeholder="₺0" /></label><label><span>Bağlantı</span><input value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://" /></label></>}{type === "task" && taskCategory === "place" && <><label><span>Şehir</span><input value={city} onChange={(event) => setCity(event.target.value)} /></label><label><span>Yer türü</span><input value={placeType} onChange={(event) => setPlaceType(event.target.value)} placeholder="Müze, kafe…" /></label></>}{type === "work" && <label><span>Alan</span><select value={workspace} onChange={(event) => setWorkspace(event.target.value as WorkNote["workspace"])}>{["TURASİSTAN","WEB SİTESİ","TASARIM","GENEL"].map((item) => <option key={item}>{item}</option>)}</select></label>}</div>
    </> : <div className="os-organize-flow"><label><span>Aklındaki her şeyi yaz</span><textarea value={brainDump} onChange={(event) => { setBrainDump(event.target.value); setOrganized([]); }} placeholder={"Yarın raporu gönder.\nTitan atmosferini araştır.\nMarketten kahve al."} /></label>{!organized.length ? <button type="button" className="os-organize-button" onClick={prepare} disabled={!brainDump.trim()}><Sparkles />Maddelere ayır</button> : <div className="os-organized-list">{organized.map((item) => <article key={item.id}><input value={item.title} onChange={(event) => setOrganized((current) => current.map((entry) => entry.id === item.id ? { ...entry, title: event.target.value } : entry))} /><select value={item.destination} onChange={(event) => setOrganized((current) => current.map((entry) => entry.id === item.id ? { ...entry, destination: event.target.value as Destination } : entry))}>{(Object.keys(destinationLabels) as Destination[]).map((destination) => <option key={destination} value={destination}>{destinationLabels[destination]}</option>)}</select><button type="button" onClick={() => setOrganized((current) => current.filter((entry) => entry.id !== item.id))}><X /></button></article>)}</div>}</div>}
    <footer><button type="button" className="os-quiet-button" onClick={close}>Vazgeç</button><button className="os-solid-button" disabled={mode === "single" ? !title.trim() : !organized.length}>{mode === "organize" ? <><Check />{organized.length} kaydı ekle</> : <><Plus />Kaydı oluştur</>}</button></footer>
  </form></div>;
}
