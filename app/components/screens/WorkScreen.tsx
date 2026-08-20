"use client";

import { BriefcaseBusiness, CalendarDays, Check, Circle, ExternalLink, Folder, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import type { PersonalOSState, WorkNote } from "@/lib/types";
import { cx, EmptyView, formatDate, ProgressBar, ScreenHeader, uid } from "./ScreenKit";

const workspaces: WorkNote["workspace"][] = ["TURASİSTAN", "WEB SİTESİ", "TASARIM", "GENEL"];

export default function WorkScreen({ state, setState, openCapture }: {
  state: PersonalOSState;
  setState: React.Dispatch<React.SetStateAction<PersonalOSState>>;
  openCapture: (workspace: WorkNote["workspace"]) => void;
}) {
  const [workspace, setWorkspace] = useState<WorkNote["workspace"]>("WEB SİTESİ");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newChecklist, setNewChecklist] = useState("");
  const visible = state.workNotes.filter((note) => note.workspace === workspace && note.status !== "Tamamlandı");
  const selected = state.workNotes.find((note) => note.id === selectedId) ?? null;
  const updateNote = (id: string, updates: Partial<WorkNote>) => setState((current) => ({ ...current, workNotes: current.workNotes.map((note) => note.id === id ? { ...note, ...updates } : note) }));
  const addChecklist = (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !newChecklist.trim()) return;
    updateNote(selected.id, { checklist: [...selected.checklist, { id: uid("work-sub"), title: newChecklist.trim(), completed: false }] });
    setNewChecklist("");
  };

  return <div className="os-screen os-work-screen">
    <ScreenHeader title="Kıbleteyn" kicker="İŞ ALANI" action="İş ekle" onAction={() => openCapture(workspace)} />
    <div className="os-workspace-switch">{workspaces.map((item) => <button className={workspace === item ? "is-active" : ""} key={item} onClick={() => setWorkspace(item)}><Folder /><span>{item}</span><b>{state.workNotes.filter((note) => note.workspace === item && note.status !== "Tamamlandı").length}</b></button>)}</div>
    <div className="os-work-grid">{visible.map((note) => {
      const completed = note.checklist.filter((item) => item.completed).length;
      const progress = note.checklist.length ? Math.round((completed / note.checklist.length) * 100) : 0;
      return <button className="os-inset-card os-work-card" key={note.id} onClick={() => setSelectedId(note.id)}><span className={cx("os-priority-pin", `is-${note.priority}`)} /><small>{note.status}</small><h2>{note.title}</h2><p>{note.description}</p><div><ProgressBar value={progress} /><b>{completed}/{note.checklist.length || "–"}</b></div><footer><span><CalendarDays />{formatDate(note.date)}</span><strong>Detay</strong></footer></button>;
    })}<button className="os-work-add" onClick={() => openCapture(workspace)}><Plus /><strong>Yeni iş</strong><span>{workspace}</span></button>{!visible.length && <EmptyView icon={BriefcaseBusiness} title="Bu alanda açık iş yok" />}</div>

    {selected && <div className="os-sheet-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedId(null)}><aside className="os-detail-sheet os-work-detail" role="dialog" aria-modal="true" aria-label={`${selected.title} ayrıntıları`}>
      <header><span>{selected.workspace}</span><button onClick={() => setSelectedId(null)} aria-label="Ayrıntıyı kapat"><X /></button></header>
      <input className="os-detail-title" value={selected.title} onChange={(event) => updateNote(selected.id, { title: event.target.value })} aria-label="İş başlığı" />
      <div className="os-form-grid"><label><span>Durum</span><select value={selected.status} onChange={(event) => updateNote(selected.id, { status: event.target.value as WorkNote["status"] })}><option>Bekliyor</option><option>Devam Ediyor</option><option>Tamamlandı</option></select></label><label><span>Öncelik</span><select value={selected.priority} onChange={(event) => updateNote(selected.id, { priority: event.target.value as WorkNote["priority"] })}><option value="low">Düşük</option><option value="medium">Normal</option><option value="high">Yüksek</option></select></label><label><span>Tarih</span><input type="date" value={selected.date} onChange={(event) => updateNote(selected.id, { date: event.target.value })} /></label><label><span>Alan</span><select value={selected.workspace} onChange={(event) => updateNote(selected.id, { workspace: event.target.value as WorkNote["workspace"] })}>{workspaces.map((item) => <option key={item}>{item}</option>)}</select></label></div>
      <label className="os-detail-notes"><span>Açıklama</span><textarea value={selected.description} onChange={(event) => updateNote(selected.id, { description: event.target.value })} /></label>
      <section className="os-detail-section"><header><strong>Kontrol listesi</strong><span>{selected.checklist.filter((item) => item.completed).length}/{selected.checklist.length}</span></header><div className="os-subtask-list">{selected.checklist.map((item) => <button className={item.completed ? "is-complete" : ""} key={item.id} onClick={() => updateNote(selected.id, { checklist: selected.checklist.map((entry) => entry.id === item.id ? { ...entry, completed: !entry.completed } : entry) })}>{item.completed ? <Check /> : <Circle />}{item.title}</button>)}</div><form className="os-subtask-add" onSubmit={addChecklist}><input value={newChecklist} onChange={(event) => setNewChecklist(event.target.value)} placeholder="Yeni adım…" /><button><Plus /></button></form></section>
      {selected.links?.map((link) => <a className="os-external-link" key={link} href={link.startsWith("http") ? link : undefined}><ExternalLink />{link}</a>)}
      <button className="os-delete-button" onClick={() => { setState((current) => ({ ...current, workNotes: current.workNotes.filter((note) => note.id !== selected.id) })); setSelectedId(null); }}><Trash2 />Kaydı sil</button>
    </aside></div>}
  </div>;
}
