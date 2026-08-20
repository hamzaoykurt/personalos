"use client";

import { Archive, CheckCircle2, FileText, Orbit, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { PersonalOSState } from "@/lib/types";
import { EmptyView, ScreenHeader } from "./ScreenKit";

type ArchiveTab = "projects" | "tasks" | "notes";

export default function ArchiveScreen({ state, setState }: { state: PersonalOSState; setState: React.Dispatch<React.SetStateAction<PersonalOSState>> }) {
  const [tab, setTab] = useState<ArchiveTab>("projects");
  const projects = state.projects.filter((project) => project.status === "done");
  const tasks = state.tasks.filter((task) => task.completed);
  const notes = state.notes.filter((note) => note.archived);
  return <div className="os-screen os-archive-screen"><ScreenHeader title="Arşiv" kicker="TAMAMLANANLAR" /><div className="os-category-switch os-archive-switch"><button className={tab === "projects" ? "is-active" : ""} onClick={() => setTab("projects")}><Orbit /><span>Projeler</span><b>{projects.length}</b></button><button className={tab === "tasks" ? "is-active" : ""} onClick={() => setTab("tasks")}><CheckCircle2 /><span>Görevler</span><b>{tasks.length}</b></button><button className={tab === "notes" ? "is-active" : ""} onClick={() => setTab("notes")}><FileText /><span>Notlar</span><b>{notes.length}</b></button></div><section className="os-inset-card os-archive-list">
    {tab === "projects" && projects.map((project) => <article key={project.id}><Orbit /><span><strong>{project.title}</strong><small>{project.category}</small></span><button onClick={() => setState((current) => ({ ...current, projects: current.projects.map((item) => item.id === project.id ? { ...item, status: "progress" } : item) }))}><RotateCcw />Geri aç</button></article>)}
    {tab === "tasks" && tasks.map((task) => <article key={task.id}><CheckCircle2 /><span><strong>{task.title}</strong><small>{task.category === "purchase" ? "Alınacak" : task.category === "place" ? "Gezilecek" : "Yapılacak"}</small></span><button onClick={() => setState((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, completed: false, completedAt: undefined } : item) }))}><RotateCcw />Geri aç</button></article>)}
    {tab === "notes" && notes.map((note) => <article key={note.id}><FileText /><span><strong>{note.title}</strong><small>{note.folder}</small></span><button onClick={() => setState((current) => ({ ...current, notes: current.notes.map((item) => item.id === note.id ? { ...item, archived: false } : item) }))}><RotateCcw />Geri aç</button></article>)}
    {(tab === "projects" ? !projects.length : tab === "tasks" ? !tasks.length : !notes.length) && <EmptyView icon={Archive} title="Bu arşiv boş" />}
  </section></div>;
}
