"use client";

import { BriefcaseBusiness, Check, FileText, Lightbulb, ListChecks, Mic2, Orbit, Plus, Sparkles, Square, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { CaptureType } from "@/lib/navigation";
import type { Note, PersonalOSState, Priority, Project, Task, TaskCategory, WorkNote } from "@/lib/types";
import { parseVoiceCommands, type VoiceDestination } from "@/lib/voice-command";
import { todayIso, uid } from "../screens/ScreenKit";

type Destination = VoiceDestination;
type OrganizedItem = { id: string; title: string; destination: Destination; subtasks?: string[]; mergeIntoExisting?: boolean };
type VoiceState = "idle" | "listening" | "error";
type SpeechResultEvent = Event & { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> };
type SpeechErrorEvent = Event & { error: string };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const typeMeta: Array<{ id: CaptureType; label: string; icon: typeof ListChecks }> = [
  { id: "task", label: "Görev", icon: ListChecks }, { id: "note", label: "Not", icon: FileText }, { id: "project", label: "Proje", icon: Orbit }, { id: "work", label: "İş", icon: BriefcaseBusiness }, { id: "research", label: "Araştırma", icon: Lightbulb },
];
const destinationLabels: Record<Destination, string> = { task: "Yapılacak", purchase: "Alınacak", place: "Gezilecek", note: "Not", project: "Proje", work: "İş", research: "Araştırma" };

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
  const [mode, setMode] = useState<"single" | "organize" | "voice">(initialMode);
  const [taskCategory, setTaskCategory] = useState(initialTaskCategory);
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [title, setTitle] = useState(""); const [detail, setDetail] = useState(""); const [date, setDate] = useState(todayIso()); const [time, setTime] = useState(""); const [priority, setPriority] = useState<Priority>("medium"); const [projectId, setProjectId] = useState("");
  const [estimate, setEstimate] = useState(""); const [link, setLink] = useState(""); const [city, setCity] = useState(""); const [placeType, setPlaceType] = useState("");
  const [brainDump, setBrainDump] = useState(""); const [organized, setOrganized] = useState<OrganizedItem[]>([]);
  const [voiceText, setVoiceText] = useState(""); const [voiceInterim, setVoiceInterim] = useState(""); const [voiceState, setVoiceState] = useState<VoiceState>("idle"); const [voiceError, setVoiceError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  useEffect(() => { if (mode === "single") inputRef.current?.focus(); }, [mode]);
  useEffect(() => () => recognitionRef.current?.abort(), []);

  const organizeText = (value: string) => setOrganized(parseVoiceCommands(value).map((item) => ({ ...item, id: uid("organized") })));
  const prepare = () => organizeText(brainDump);

  const stopListening = () => recognitionRef.current?.stop();
  const startListening = () => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceState("error");
      setVoiceError("Bu tarayıcı sesle yazmayı desteklemiyor. Android'de güncel Chrome veya yüklü uygulamayı kullan.");
      return;
    }
    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognition.lang = "tr-TR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) finalText += `${result[0].transcript.trim()} `;
        else interimText += result[0].transcript;
      }
      if (finalText) setVoiceText((current) => `${current}${current.trim() ? " " : ""}${finalText.trim()}`);
      setVoiceInterim(interimText.trim());
      setOrganized([]);
    };
    recognition.onerror = (event) => {
      setVoiceState("error");
      setVoiceInterim("");
      setVoiceError(event.error === "not-allowed" || event.error === "service-not-allowed" ? "Mikrofon izni kapalı. Tarayıcı ayarlarından bu site için mikrofonu aç." : event.error === "no-speech" ? "Ses duyulmadı. Mikrofona biraz daha yakın konuşup yeniden dene." : "Ses anlaşılmadı. Tekrar deneyebilir veya metni elle düzeltebilirsin.");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setVoiceState((current) => current === "error" ? current : "idle");
      setVoiceInterim("");
    };
    recognitionRef.current = recognition;
    setVoiceError("");
    setVoiceInterim("");
    setVoiceState("listening");
    try { recognition.start(); } catch { setVoiceState("error"); setVoiceError("Mikrofon başlatılamadı. Birkaç saniye sonra yeniden dene."); }
  };

  const persist = (items: OrganizedItem[]) => setState((current) => {
    const tasks: Task[] = []; const projects: Project[] = []; const notes: Note[] = []; const workNotes: WorkNote[] = [];
    let existingProjects = current.projects;
    items.forEach((item) => {
      if (["task","purchase","place"].includes(item.destination)) tasks.push({ id: uid("task"), title: item.title, category: item.destination === "purchase" ? "purchase" : item.destination === "place" ? "place" : "todo", completed: false, priority: "medium", date, subtasks: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      if (item.destination === "project") {
        const subtasks = (item.subtasks ?? []).map((subtask) => ({ id: uid("sub"), title: subtask, completed: false }));
        const normalizedTitle = item.title.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşü]+/giu, " ").trim();
        const existing = item.mergeIntoExisting ? existingProjects.find((project) => {
          const candidate = project.title.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşü]+/giu, " ").trim();
          return candidate.includes(normalizedTitle) || normalizedTitle.includes(candidate);
        }) : undefined;
        if (existing) {
          existingProjects = existingProjects.map((project) => project.id === existing.id ? { ...project, subtasks: [...project.subtasks, ...subtasks], updatedAt: new Date().toISOString(), activity: [{ id: uid("activity"), type: "subtask", label: `${subtasks.length} alt görev sesli komutla eklendi`, at: new Date().toISOString() }, ...(project.activity ?? [])] } : project);
        } else {
          projects.push({ id: uid("project"), title: item.title.toUpperCase(), category: "GELEN KUTUSU", description: "Hızlı yakalamadan oluşturuldu.", status: "backlog", priority: "medium", startDate: todayIso(), progress: 0, tags: ["yakalanan"], nextAction: subtasks[0]?.title ?? "İlk net adımı tanımla", subtasks, activity: [{ id: uid("activity"), type: "created", label: "Hızlı yakalamadan oluşturuldu", at: new Date().toISOString() }] });
        }
      }
      if (item.destination === "note" || item.destination === "research") notes.push({ id: uid("note"), title: item.title, folder: item.destination === "research" ? "ARAŞTIRMA / Gelen Kutusu" : "GELEN KUTUSU", content: item.title, tags: item.destination === "research" ? ["araştırma"] : [], favorite: false, archived: false, updatedAt: todayIso() });
      if (item.destination === "work") workNotes.push({ id: uid("work"), title: item.title, workspace: "GENEL", description: "", status: "Bekliyor", priority: "medium", date, checklist: [] });
    });
    return { ...current, tasks: [...tasks, ...current.tasks], projects: [...projects, ...existingProjects], notes: [...notes, ...current.notes], workNotes: [...workNotes, ...current.workNotes] };
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === "organize" || mode === "voice") { if (!organized.length) return; recognitionRef.current?.abort(); persist(organized); close(); return; }
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
  const organizedList = <div className="os-organized-list">{organized.map((item) => <article key={item.id}><input aria-label="Kayıt başlığı" value={item.title} onChange={(event) => setOrganized((current) => current.map((entry) => entry.id === item.id ? { ...entry, title: event.target.value } : entry))} /><select aria-label="Kayıt bölümü" value={item.destination} onChange={(event) => setOrganized((current) => current.map((entry) => entry.id === item.id ? { ...entry, destination: event.target.value as Destination, mergeIntoExisting: false } : entry))}>{(Object.keys(destinationLabels) as Destination[]).map((destination) => <option key={destination} value={destination}>{destinationLabels[destination]}</option>)}</select><button type="button" aria-label="Kaydı kaldır" onClick={() => setOrganized((current) => current.filter((entry) => entry.id !== item.id))}><X /></button>{item.subtasks?.length ? <small className="os-organized-subtasks"><b>{item.mergeIntoExisting ? "MEVCUT PROJEYE" : "ALT GÖREVLER"}</b>{item.subtasks.join(" · ")}</small> : null}</article>)}</div>;
  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
  return <div className="os-sheet-layer os-capture-layer" onMouseDown={(event) => event.target === event.currentTarget && close()}><form className="os-capture-sheet" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Yeni kayıt">
    <header><div><span>HIZLI YAKALA</span><h2>{mode === "single" ? "Yeni kayıt" : mode === "voice" ? "Sesli komut" : "Düzenle ve dağıt"}</h2></div><button type="button" onClick={close} aria-label="Yeni kaydı kapat"><X /></button></header>
    <div className="os-capture-mode"><button type="button" className={mode === "single" ? "is-active" : ""} onClick={() => setMode("single")}><Plus />Tek kayıt</button><button type="button" className={mode === "organize" ? "is-active" : ""} onClick={() => setMode("organize")}><Sparkles />Toplu ayır</button><button type="button" className={mode === "voice" ? "is-active" : ""} onClick={() => { setMode("voice"); setOrganized([]); }}><Mic2 />Sesli komut</button></div>
    {mode === "single" ? <>
      <div className="os-capture-types">{typeMeta.map((item) => { const Icon = item.icon; return <button type="button" className={type === item.id ? "is-active" : ""} key={item.id} onClick={() => setType(item.id)}><Icon /><span>{item.label}</span></button>; })}</div>
      {type === "task" && <div className="os-context-switch">{(["todo","purchase","place"] as TaskCategory[]).map((item) => <button type="button" className={taskCategory === item ? "is-active" : ""} key={item} onClick={() => setTaskCategory(item)}>{item === "todo" ? "Yapılacak" : item === "purchase" ? "Alınacak" : "Gezilecek"}</button>)}</div>}
      <label><span>Başlık</span><input ref={inputRef} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={titlePlaceholder} /></label>
      <label><span>Not</span><textarea value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="Yalnızca gerekli bağlam…" /></label>
      <div className="os-capture-grid">{["task","project","work"].includes(type) && <label><span>Tarih</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>}{["task","project","work"].includes(type) && <label><span>Öncelik</span><select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option value="low">Düşük</option><option value="medium">Normal</option><option value="high">Yüksek</option></select></label>}{type === "task" && taskCategory === "todo" && <><label><span>Saat</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label><label><span>Proje</span><select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">Proje yok</option>{state.projects.filter((item) => item.status !== "done").map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label></>}{type === "task" && taskCategory === "purchase" && <><label><span>Tahmini fiyat</span><input value={estimate} onChange={(event) => setEstimate(event.target.value)} placeholder="₺0" /></label><label><span>Bağlantı</span><input value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://" /></label></>}{type === "task" && taskCategory === "place" && <><label><span>Şehir</span><input value={city} onChange={(event) => setCity(event.target.value)} /></label><label><span>Yer türü</span><input value={placeType} onChange={(event) => setPlaceType(event.target.value)} placeholder="Müze, kafe…" /></label></>}{type === "work" && <label><span>Alan</span><select value={workspace} onChange={(event) => setWorkspace(event.target.value as WorkNote["workspace"])}>{["TURASİSTAN","WEB SİTESİ","TASARIM","GENEL"].map((item) => <option key={item}>{item}</option>)}</select></label>}</div>
    </> : mode === "organize" ? <div className="os-organize-flow"><label><span>Aklındaki her şeyi yaz</span><textarea value={brainDump} onChange={(event) => { setBrainDump(event.target.value); setOrganized([]); }} placeholder={"Görevler: raporu gönder, toplantıyı planla.\nProje: Yeni site. Alt görevler: taslak, mobil test."} /></label>{!organized.length ? <button type="button" className="os-organize-button" onClick={prepare} disabled={!brainDump.trim()}><Sparkles />Maddelere ayır</button> : organizedList}</div> : <div className={`os-voice-capture is-${voiceState}`}>
      <section className="os-voice-command-hero"><button type="button" className="os-voice-trigger" onClick={voiceState === "listening" ? stopListening : startListening} aria-label={voiceState === "listening" ? "Dinlemeyi durdur" : "Sesli komutu başlat"}>{voiceState === "listening" ? <Square /> : <Mic2 />}</button><span><strong>{voiceState === "listening" ? "Dinliyorum…" : voiceText ? "Komut hazır" : "Konuşmaya başla"}</strong><small>Görev, not, iş veya proje söyle. Proje alt görevlerini de ayırırım.</small></span></section>
      {voiceError && <p className="os-voice-error" role="alert">{voiceError}</p>}
      <label className="os-voice-transcript"><span>DUYULAN METİN</span><textarea value={voiceText} onChange={(event) => { setVoiceText(event.target.value); setOrganized([]); }} placeholder="Örnek: Proje Personal OS. Alt görevler: mobil testi yap, manifesti kontrol et. Görevler: raporu gönder, kahve al." /></label>
      {voiceInterim && <p className="os-voice-interim" aria-live="polite">{voiceInterim}</p>}
      {!organized.length ? <button type="button" className="os-organize-button" onClick={() => organizeText(voiceText)} disabled={!voiceText.trim()}><Sparkles />Düzenle ve önizle</button> : organizedList}
    </div>}
    <footer><button type="button" className="os-quiet-button" onClick={close}>Vazgeç</button><button className="os-solid-button" disabled={mode === "single" ? !title.trim() : !organized.length}>{mode === "single" ? <><Plus />Kaydı oluştur</> : <><Check />{organized.length} kaydı ekle</>}</button></footer>
  </form></div>;
}
