"use client";

import { Archive, ArrowLeft, CheckSquare, ChevronRight, FileText, Folder, Heading2, List, Plus, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import type { Note, PersonalOSState } from "@/lib/types";
import { EmptyView, formatDate, ScreenHeader, todayIso } from "./ScreenKit";

export default function NotesScreen({ state, setState, openCapture }: {
  state: PersonalOSState;
  setState: React.Dispatch<React.SetStateAction<PersonalOSState>>;
  openCapture: () => void;
}) {
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("TÜMÜ");
  const [selectedId, setSelectedId] = useState(state.notes.find((note) => !note.archived)?.id ?? "");
  const [mobileStep, setMobileStep] = useState<"folders" | "list" | "editor">("folders");
  const rootFolders = useMemo(() => Array.from(new Set(state.notes.filter((note) => !note.archived).map((note) => note.folder.split(" / ")[0]))), [state.notes]);
  const visible = state.notes.filter((note) => !note.archived && (folder === "TÜMÜ" || folder === "FAVORİLER" ? (folder === "TÜMÜ" || note.favorite) : note.folder.startsWith(folder)) && `${note.title} ${note.content} ${note.tags.join(" ")}`.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR")));
  const selected = state.notes.find((note) => note.id === selectedId) ?? visible[0] ?? null;
  const updateNote = (note: Note, updates: Partial<Note>) => setState((current) => ({ ...current, notes: current.notes.map((item) => item.id === note.id ? { ...item, ...updates, updatedAt: todayIso() } : item) }));
  const appendMarkdown = (prefix: string) => selected && updateNote(selected, { content: `${selected.content}${selected.content.endsWith("\n") || !selected.content ? "" : "\n"}${prefix}` });

  const chooseFolder = (value: string) => { setFolder(value); setMobileStep("list"); };
  const chooseNote = (id: string) => { setSelectedId(id); setMobileStep("editor"); };

  return <div className="os-screen os-notes-screen">
    <ScreenHeader title="Notlar" kicker="BİLGİ ARŞİVİ" action="Not ekle" onAction={openCapture} />
    <div className="os-notes-mobile-head">{mobileStep !== "folders" && <button onClick={() => setMobileStep(mobileStep === "editor" ? "list" : "folders")}><ArrowLeft />Geri</button>}<span>{mobileStep === "folders" ? "Klasörler" : mobileStep === "list" ? folder : selected?.title}</span></div>
    <div className="os-notes-layout" data-mobile-step={mobileStep}>
      <aside className="os-inset-card os-folder-pane">
        <label className="os-search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Notlarda ara" /></label>
        <button className={folder === "TÜMÜ" ? "is-active" : ""} onClick={() => chooseFolder("TÜMÜ")}><Folder /><span>Tüm notlar</span><b>{state.notes.filter((note) => !note.archived).length}</b><ChevronRight /></button>
        <button className={folder === "FAVORİLER" ? "is-active" : ""} onClick={() => chooseFolder("FAVORİLER")}><Star /><span>Favoriler</span><b>{state.notes.filter((note) => note.favorite && !note.archived).length}</b><ChevronRight /></button>
        <small>KLASÖRLER</small>
        {rootFolders.map((name) => <button className={folder === name ? "is-active" : ""} key={name} onClick={() => chooseFolder(name)}><Folder /><span>{name}</span><b>{state.notes.filter((note) => !note.archived && note.folder.startsWith(name)).length}</b><ChevronRight /></button>)}
        <button className="os-pane-add" onClick={openCapture}><Plus />Yeni not</button>
      </aside>

      <section className="os-inset-card os-note-list-pane">
        <header><strong>{folder === "TÜMÜ" ? "Tüm notlar" : folder}</strong><span>{visible.length}</span></header>
        <div>{visible.map((note) => <button className={selected?.id === note.id ? "is-active" : ""} key={note.id} onClick={() => chooseNote(note.id)}><span><strong>{note.title}</strong>{note.favorite && <Star />}</span><p>{note.content.replace(/[#>*_[\]-]/g, "").slice(0, 110) || "Boş not"}</p><small>{note.folder}<b>{formatDate(note.updatedAt)}</b></small></button>)}{!visible.length && <EmptyView icon={FileText} title="Bu görünüm boş" action="Not ekle" onAction={openCapture} />}</div>
      </section>

      <section className="os-inset-card os-note-editor-pane">
        {selected ? <>
          <header><span><Folder />{selected.folder}</span><div><button className={selected.favorite ? "is-active" : ""} onClick={() => updateNote(selected, { favorite: !selected.favorite })} aria-label="Favori"><Star /></button><button onClick={() => { updateNote(selected, { archived: true }); setMobileStep("list"); }} aria-label="Arşivle"><Archive /></button></div></header>
          <input className="os-note-title" value={selected.title} onChange={(event) => updateNote(selected, { title: event.target.value })} aria-label="Not başlığı" />
          <div className="os-note-tools"><button onClick={() => appendMarkdown("## ")}><Heading2 />Başlık</button><button onClick={() => appendMarkdown("- ")}><List />Liste</button><button onClick={() => appendMarkdown("- [ ] ")}><CheckSquare />Checkbox</button><button onClick={() => appendMarkdown("<details>\n<summary>Başlık</summary>\n\n</details>")}><ChevronRight />Açılır</button></div>
          <textarea value={selected.content} onChange={(event) => updateNote(selected, { content: event.target.value })} aria-label="Not içeriği" placeholder="Yazmaya başla…" />
          <footer><div>{selected.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div><small>Otomatik kaydediliyor</small></footer>
        </> : <EmptyView icon={FileText} title="Bir not seç" action="Not ekle" onAction={openCapture} />}
      </section>
    </div>
  </div>;
}
