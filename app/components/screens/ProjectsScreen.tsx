"use client";

import { ArrowUpRight, CalendarDays, Check, ChevronDown, Columns3, List, Orbit, Plus } from "lucide-react";
import { useState } from "react";
import { projectProgress } from "@/lib/state";
import type { PersonalOSState, Project, ProjectStatus } from "@/lib/types";
import { cx, EmptyView, formatDate, ProgressBar, ScreenHeader, uid } from "./ScreenKit";

const columns: ProjectStatus[] = ["backlog", "todo", "progress", "review", "done"];
const labels: Record<ProjectStatus, string> = { backlog: "Backlog", todo: "Yapılacak", progress: "Devam", review: "Kontrol", done: "Bitti" };

function StatusSelect({ project, moveProject, board = false }: { project: Project; moveProject: (project: Project, status: ProjectStatus) => void; board?: boolean }) {
  return <label className={cx("os-status-select", `is-${project.status}`, board && "is-board")}>
    <span className="os-status-value" aria-hidden="true"><i /><b>{labels[project.status]}</b><ChevronDown /></span>
    <select value={project.status} onChange={(event) => moveProject(project, event.target.value as ProjectStatus)} aria-label={`${project.title} durumunu değiştir`}>{columns.map((status) => <option value={status} key={status}>{labels[status]}</option>)}</select>
  </label>;
}

export default function ProjectsScreen({ state, setState, openProject, openCapture }: {
  state: PersonalOSState;
  setState: React.Dispatch<React.SetStateAction<PersonalOSState>>;
  openProject: (id: string) => void;
  openCapture: () => void;
}) {
  const [view, setView] = useState<"list" | "board">("list");
  const [boardStatus, setBoardStatus] = useState<ProjectStatus>("progress");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const activeProjects = state.projects.filter((project) => project.status !== "done");

  const moveProject = (project: Project, status: ProjectStatus) => {
    if (project.status === status) return;
    setState((current) => ({
      ...current,
      projects: current.projects.map((item) => item.id === project.id ? {
        ...item,
        status,
        updatedAt: new Date().toISOString(),
        activity: [{ id: uid("activity"), type: "status", label: `${labels[project.status]} → ${labels[status]}`, at: new Date().toISOString() }, ...(item.activity ?? [])],
      } : item),
    }));
  };

  return <div className="os-screen os-projects-screen">
    <ScreenHeader title="Projeler" kicker="ÜRETİM MERKEZİ" action="Proje ekle" onAction={openCapture} aside={
      <div className="os-view-switch" aria-label="Proje görünümü">
        <button className={view === "list" ? "is-active" : ""} onClick={() => setView("list")} aria-pressed={view === "list"}><List />Liste</button>
        <button className={view === "board" ? "is-active" : ""} onClick={() => setView("board")} aria-pressed={view === "board"}><Columns3 />Pano</button>
      </div>
    } />

    {view === "list" ? <div className="os-project-list">
      {activeProjects.map((project) => {
        const completed = project.subtasks.filter((item) => item.completed).length;
        const progress = projectProgress(project);
        return <article className="os-inset-card os-project-row" key={project.id}>
          <button className="os-project-open" onClick={() => openProject(project.id)}>
            <span className={cx("os-project-signal", `is-${project.status}`)}><Orbit /></span>
            <span className="os-project-copy"><small>{project.category}</small><strong>{project.title}</strong><em>{project.nextAction}</em></span>
            <span className="os-project-progress"><b>{completed}/{project.subtasks.length || "–"}</b><ProgressBar value={progress} /></span>
            <span className="os-project-date">{project.dueDate ? <><CalendarDays />{formatDate(project.dueDate)}</> : "Açık"}</span>
            <ArrowUpRight className="os-project-arrow" />
          </button>
          <StatusSelect project={project} moveProject={moveProject} />
        </article>;
      })}
      {!activeProjects.length && <EmptyView icon={Check} title="Aktif proje kalmadı" action="Yeni proje" onAction={openCapture} />}
    </div> : <>
      <div className="os-board-tabs" aria-label="Mobil pano sütunları">{columns.map((status) => <button key={status} className={boardStatus === status ? "is-active" : ""} onClick={() => setBoardStatus(status)}><span>{labels[status]}</span><b>{state.projects.filter((item) => item.status === status).length}</b></button>)}</div>
      <div className="os-board">
        {columns.map((status) => <section className={cx("os-board-column", boardStatus === status && "is-mobile-active")} key={status} onDragOver={(event) => event.preventDefault()} onDrop={() => {
          const project = state.projects.find((item) => item.id === draggedId);
          if (project) moveProject(project, status);
          setDraggedId(null);
        }}>
          <header><span className={cx("os-status-dot", `is-${status}`)} /><strong>{labels[status]}</strong><b>{state.projects.filter((item) => item.status === status).length}</b></header>
          <div>{state.projects.filter((item) => item.status === status).map((project) => {
            const progress = projectProgress(project);
            return <article className="os-inset-card os-board-card" draggable key={project.id} onDragStart={() => setDraggedId(project.id)} onDragEnd={() => setDraggedId(null)}>
              <button onClick={() => openProject(project.id)}><small>{project.category}</small><strong>{project.title}</strong><p>{project.nextAction}</p><span><ProgressBar value={progress} /><b>{project.subtasks.filter((item) => item.completed).length}/{project.subtasks.length || "–"}</b></span></button>
              <StatusSelect project={project} moveProject={moveProject} board />
            </article>;
          })}<button className="os-board-add" onClick={openCapture}><Plus />Ekle</button></div>
        </section>)}
      </div>
    </>}
  </div>;
}
