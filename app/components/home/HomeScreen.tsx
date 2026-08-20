"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  FolderKanban,
  Plus,
  Sparkles,
} from "lucide-react";
import type { PersonalOSState } from "@/lib/types";
import styles from "./HomeScreen.module.css";

type CaptureType = "task" | "note" | "project" | "work" | "research";
type Section = "home" | "projects" | "tasks" | "calendar" | "career" | "work" | "notes" | "archive" | "settings";

type HomeScreenProps = {
  state: PersonalOSState;
  toggleTask: (id: string) => void;
  openCapture: (type: CaptureType) => void;
  openQuickCapture: () => void;
  openProject: (id: string) => void;
  go: (section: Section) => void;
};

function localIsoDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function taskContext(state: PersonalOSState, projectId?: string) {
  if (!projectId) return "Kişisel";
  return state.projects.find((project) => project.id === projectId)?.title ?? "Proje";
}

function completedSubtasks(items: Array<{ completed: boolean }>) {
  return items.filter((item) => item.completed).length;
}

function weeklyLabel(label: string) {
  return label.toLocaleUpperCase("tr-TR") === "ENGLISH" ? "İngilizce" : label.toLocaleLowerCase("tr-TR");
}

export default function HomeScreen({ state, toggleTask, openCapture, openQuickCapture, openProject, go }: HomeScreenProps) {
  const today = localIsoDate();
  const todayTasks = state.tasks.filter((task) => task.date === today && !task.completed).slice(0, 5);
  const focusTask = todayTasks.find((task) => task.priority === "high") ?? todayTasks[0];
  const remainingTasks = todayTasks.filter((task) => task.id !== focusTask?.id).slice(0, 3);
  const activeProjects = state.projects.filter((project) => project.status !== "done").slice(0, 2);
  const weeklyTargets = state.weeklyTargets.slice(0, 4);
  const continueProject = activeProjects.find((project) => project.status === "progress") ?? activeProjects[0];
  const continueNote = state.notes.find((note) => !note.archived);

  const dateLabel = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className={styles.home}>
      <header className={styles.header}>
        <div>
          <span>{dateLabel}</span>
          <h1>Bugün.</h1>
        </div>
      </header>

      {focusTask ? (
        <section className={styles.focusCard} aria-labelledby="focus-title">
          <div className={styles.focusGlow} aria-hidden="true" />
          <div className={styles.focusTopline}>
            <span><Sparkles aria-hidden="true" /> Şimdi</span>
            {focusTask.time && <time><Clock3 aria-hidden="true" />{focusTask.time}</time>}
          </div>
          <h2 id="focus-title">{focusTask.title}</h2>
          <button className={styles.completeAction} onClick={() => toggleTask(focusTask.id)}>
            <Check aria-hidden="true" /> Bitir
          </button>
        </section>
      ) : (
        <section className={styles.focusCard} aria-labelledby="focus-empty-title">
          <div className={styles.focusGlow} aria-hidden="true" />
          <div className={styles.focusTopline}><span><CheckCircle2 aria-hidden="true" /> Bugün</span></div>
          <h2 id="focus-empty-title">Alan açık.</h2>
          <button className={styles.completeAction} onClick={() => openCapture("task")}><Plus aria-hidden="true" /> Görev ekle</button>
        </section>
      )}

      <button className={styles.captureBar} onClick={openQuickCapture}>
        <span className={styles.captureIcon}><Plus aria-hidden="true" /></span>
        <strong>Hızlı yakala</strong>
        <ArrowRight aria-hidden="true" />
      </button>

      <section className={styles.section} aria-labelledby="today-title">
        <div className={styles.sectionHeader}>
          <h2 id="today-title">Sıradaki</h2>
          <button onClick={() => go("tasks")} aria-label="Tüm görevleri aç"><ArrowUpRight aria-hidden="true" /></button>
        </div>

        <div className={styles.taskList}>
          {remainingTasks.map((task) => (
            <div className={styles.taskRow} key={task.id}>
              <button onClick={() => toggleTask(task.id)} aria-label={`${task.title} görevini tamamla`}>
                <Circle aria-hidden="true" />
              </button>
              <strong>{task.title}</strong>
              <small>{task.time ?? taskContext(state, task.projectId)}</small>
            </div>
          ))}
          {!remainingTasks.length && (
            <div className={styles.compactEmpty}><CheckCircle2 aria-hidden="true" /><span>Bugünlük tamam.</span></div>
          )}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="projects-title">
        <div className={styles.sectionHeader}>
          <h2 id="projects-title">Projeler</h2>
          <button onClick={() => go("projects")} aria-label="Tüm projeleri aç"><ArrowUpRight aria-hidden="true" /></button>
        </div>

        <div className={styles.projectGrid}>
          {activeProjects.map((project) => {
            const done = completedSubtasks(project.subtasks);
            return (
              <button key={project.id} onClick={() => openProject(project.id)} className={styles.projectCard}>
                <span className={styles.projectTopline}>
                  <span className={styles.projectGlyph}><FolderKanban aria-hidden="true" /></span>
                  <span className={styles.projectCount}>{done}/{project.subtasks.length}</span>
                </span>
                <strong>{project.title}</strong>
                <small>{project.nextAction}</small>
                <ArrowUpRight className={styles.projectArrow} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="week-title">
        <div className={styles.sectionHeader}>
          <h2 id="week-title">Bu hafta</h2>
          <button onClick={() => go("career")} aria-label="Haftalık hedefleri aç"><ArrowUpRight aria-hidden="true" /></button>
        </div>

        <div className={styles.weekPanel}>
          {weeklyTargets.map((target) => {
            const progress = Math.min((target.current / Math.max(target.target, 1)) * 100, 100);
            return (
              <button key={target.id} onClick={() => go("career")} className={styles.weekRow}>
                <span>{weeklyLabel(target.shortLabel)}</span>
                <i><b style={{ width: `${progress}%` }} /></i>
                <strong>{target.current}<small>/{target.target}</small></strong>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="continue-title">
        <div className={styles.sectionHeader}>
          <h2 id="continue-title">Devam et</h2>
        </div>
        <div className={styles.continueList}>
          {continueProject && (
            <button onClick={() => openProject(continueProject.id)}>
              <span className={styles.continueIcon}><FolderKanban aria-hidden="true" /></span>
              <span><small>Proje</small><strong>{continueProject.nextAction}</strong></span>
              <ArrowUpRight aria-hidden="true" />
            </button>
          )}
          {continueNote && (
            <button onClick={() => go("notes")}>
              <span className={styles.continueIcon}><FileText aria-hidden="true" /></span>
              <span><small>Not</small><strong>{continueNote.title}</strong></span>
              <ArrowUpRight aria-hidden="true" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
