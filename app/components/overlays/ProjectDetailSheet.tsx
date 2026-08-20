"use client";

import { Check, Circle, ExternalLink, Plus, Target, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { projectProgress } from "@/lib/state";
import type { PersonalOSState, Project, ProjectStatus } from "@/lib/types";
import { formatDate, ProgressBar, uid } from "../screens/ScreenKit";

const statusLabels: Record<ProjectStatus, string> = { backlog: "Backlog", todo: "Yapılacak", progress: "Devam ediyor", review: "Kontrol", done: "Tamamlandı" };

export default function ProjectDetailSheet({ project, setState, close }: { project: Project; setState: React.Dispatch<React.SetStateAction<PersonalOSState>>; close: () => void }) {
  const [newSubtask, setNewSubtask] = useState("");
  const update = (updates: Partial<Project>, activity?: string) => setState((current) => ({ ...current, projects: current.projects.map((item) => item.id === project.id ? { ...item, ...updates, updatedAt: new Date().toISOString(), activity: activity ? [{ id: uid("activity"), type: "updated", label: activity, at: new Date().toISOString() }, ...(item.activity ?? [])] : item.activity } : item) }));
  const toggleSubtask = (id: string) => {
    const subtasks = project.subtasks.map((item) => item.id === id ? { ...item, completed: !item.completed } : item);
    update({ subtasks, progress: projectProgress({ subtasks, progress: project.progress }) }, "Alt görev güncellendi");
  };
  const addSubtask = (event: FormEvent) => { event.preventDefault(); if (!newSubtask.trim()) return; update({ subtasks: [...project.subtasks, { id: uid("sub"), title: newSubtask.trim(), completed: false }] }, "Yeni alt görev eklendi"); setNewSubtask(""); };
  const progress = projectProgress(project);
  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
  return <div className="os-sheet-layer" onMouseDown={(event) => event.target === event.currentTarget && close()}><aside className="os-detail-sheet os-project-detail" role="dialog" aria-modal="true" aria-label={`${project.title} proje ayrıntıları`}>
    <header><span>{project.category}</span><button onClick={close} aria-label="Proje ayrıntısını kapat"><X /></button></header>
    <input className="os-detail-title" value={project.title} onChange={(event) => update({ title: event.target.value })} aria-label="Proje başlığı" />
    <label className="os-detail-notes"><span>Açıklama</span><textarea value={project.description} onChange={(event) => update({ description: event.target.value })} /></label>
    <div className="os-project-progress-detail"><div><span>İlerleme</span><strong>{project.subtasks.filter((item) => item.completed).length}/{project.subtasks.length || "–"}</strong></div><ProgressBar value={progress} /></div>
    <div className="os-form-grid"><label><span>Durum</span><select value={project.status} onChange={(event) => update({ status: event.target.value as ProjectStatus }, `Durum: ${statusLabels[event.target.value as ProjectStatus]}`)}>{(Object.keys(statusLabels) as ProjectStatus[]).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label><label><span>Öncelik</span><select value={project.priority} onChange={(event) => update({ priority: event.target.value as Project["priority"] })}><option value="low">Düşük</option><option value="medium">Normal</option><option value="high">Yüksek</option></select></label><label><span>Başlangıç</span><input type="date" value={project.startDate} onChange={(event) => update({ startDate: event.target.value })} /></label><label><span>Son tarih</span><input type="date" value={project.dueDate ?? ""} onChange={(event) => update({ dueDate: event.target.value || undefined })} /></label></div>
    <section className="os-next-step"><span><Target />SONRAKİ ADIM</span><input value={project.nextAction} onChange={(event) => update({ nextAction: event.target.value })} /></section>
    <section className="os-detail-section"><header><strong>Görevler</strong><span>{project.subtasks.filter((item) => item.completed).length}/{project.subtasks.length}</span></header><div className="os-subtask-list">{project.subtasks.map((item) => <button className={item.completed ? "is-complete" : ""} key={item.id} onClick={() => toggleSubtask(item.id)}>{item.completed ? <Check /> : <Circle />}{item.title}</button>)}</div><form className="os-subtask-add" onSubmit={addSubtask}><input value={newSubtask} onChange={(event) => setNewSubtask(event.target.value)} placeholder="Yeni görev…" /><button><Plus /></button></form></section>
    <label className="os-detail-notes"><span>Proje notu</span><textarea value={project.notes ?? ""} onChange={(event) => update({ notes: event.target.value })} placeholder="Kararlar, bağlam, hatırlatmalar…" /></label>
    <div className="os-tag-row">{project.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
    {project.links?.length ? <section className="os-link-list">{project.links.map((link) => <a key={link} href={link.startsWith("http") ? link : undefined} target="_blank" rel="noreferrer"><ExternalLink />{link}</a>)}</section> : null}
    <section className="os-activity-list"><strong>Aktivite</strong>{(project.activity ?? []).slice(0,6).map((item) => <article key={item.id}><i /><span>{item.label}</span><time>{formatDate(item.at.slice(0,10))}</time></article>)}{!(project.activity ?? []).length && <small>Yeni değişiklikler burada tutulacak.</small>}</section>
    <button className="os-delete-button" onClick={() => { setState((current) => ({ ...current, projects: current.projects.filter((item) => item.id !== project.id), tasks: current.tasks.filter((task) => task.projectId !== project.id) })); close(); }}><Trash2 />Projeyi sil</button>
  </aside></div>;
}
