"use client";

import { lazy, startTransition, Suspense, useEffect, useRef, useState } from "react";
import { createSeedState } from "@/lib/seed";
import { migrateState } from "@/lib/state";
import { sectionMeta, sectionPaths, type CaptureType, type Section } from "@/lib/navigation";
import type { PersonalOSState, TaskCategory, WorkNote } from "@/lib/types";
import HomeScreen from "./home/HomeScreen";
import { MobileNavigation, Sidebar, TopBar } from "./shell/AppNavigation";

const loadProjectsScreen = () => import("./screens/ProjectsScreen");
const loadTasksScreen = () => import("./screens/TasksScreen");
const loadCalendarScreen = () => import("./screens/CalendarScreen");
const loadRebuildScreen = () => import("./screens/RebuildScreen");
const loadWorkScreen = () => import("./screens/WorkScreen");
const loadNotesScreen = () => import("./screens/NotesScreen");
const loadArchiveScreen = () => import("./screens/ArchiveScreen");
const loadSettingsScreen = () => import("./screens/SettingsScreen");
const loadCaptureSheet = () => import("./overlays/CaptureSheet");
const loadCommandPalette = () => import("./overlays/CommandPalette");
const loadProjectDetailSheet = () => import("./overlays/ProjectDetailSheet");

const ProjectsScreen = lazy(loadProjectsScreen);
const TasksScreen = lazy(loadTasksScreen);
const CalendarScreen = lazy(loadCalendarScreen);
const RebuildScreen = lazy(loadRebuildScreen);
const WorkScreen = lazy(loadWorkScreen);
const NotesScreen = lazy(loadNotesScreen);
const ArchiveScreen = lazy(loadArchiveScreen);
const SettingsScreen = lazy(loadSettingsScreen);
const CaptureSheet = lazy(loadCaptureSheet);
const CommandPalette = lazy(loadCommandPalette);
const ProjectDetailSheet = lazy(loadProjectDetailSheet);

const deferredModules = [loadProjectsScreen, loadTasksScreen, loadCalendarScreen, loadRebuildScreen, loadWorkScreen, loadNotesScreen, loadArchiveScreen, loadSettingsScreen, loadCaptureSheet, loadCommandPalette, loadProjectDetailSheet];

type Theme = "light" | "dark";
type SyncState = "loading" | "saved" | "saving" | "offline";
type CaptureConfig = {
  type: CaptureType;
  mode: "single" | "organize";
  taskCategory: TaskCategory;
  workspace: WorkNote["workspace"];
};

function sectionFromPath(pathname: string): Section {
  const entry = (Object.entries(sectionPaths) as Array<[Section, string]>).find(([, path]) => path === pathname);
  return entry?.[0] ?? "home";
}

export default function PersonalOS({ initialSection = "home", initialRebuildArea }: { initialSection?: Section; initialRebuildArea?: string }) {
  const [activeSection, setActiveSection] = useState<Section>(initialSection);
  const [state, setState] = useState<PersonalOSState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("loading");
  const [theme, setTheme] = useState<Theme>("dark");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [captureConfig, setCaptureConfig] = useState<CaptureConfig | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const pendingSave = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    const stored = window.localStorage.getItem("personal-os-theme") as Theme | null;
    const next = stored === "dark" || stored === "light" ? stored : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    const frame = window.requestAnimationFrame(() => setTheme(next));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/state").then(async (response) => {
      if (!response.ok) throw new Error("state unavailable");
      return (await response.json()) as { state: unknown };
    }).then((payload) => {
      if (!alive) return;
      setState(migrateState(payload.state));
      setSyncState("saved");
    }).catch(() => alive && setSyncState("offline")).finally(() => alive && setHydrated(true));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let preloaded = false;
    const preload = () => {
      if (preloaded) return;
      preloaded = true;
      for (const loadModule of deferredModules) void loadModule();
    };
    const timeoutId = window.setTimeout(preload, 400);
    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preload, { timeout: 700 });
      return () => {
        window.cancelIdleCallback(idleId);
        window.clearTimeout(timeoutId);
      };
    }
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (pendingSave.current) clearTimeout(pendingSave.current);
    queueMicrotask(() => setSyncState("saving"));
    pendingSave.current = setTimeout(() => {
      fetch("/api/state", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ state }) })
        .then((response) => { if (!response.ok) throw new Error("save failed"); setSyncState("saved"); })
        .catch(() => setSyncState("offline"));
    }, 700);
    return () => { if (pendingSave.current) clearTimeout(pendingSave.current); };
  }, [state, hydrated]);

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = state.preferences.reduceMotion ? "true" : "false";
  }, [state.preferences.reduceMotion]);

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-active", mobileMenu);
    return () => document.body.classList.remove("mobile-menu-active");
  }, [mobileMenu]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen((value) => !value); }
      if (event.key === "Escape") { setCommandOpen(false); setCaptureConfig(null); setSelectedProjectId(null); setMobileMenu(false); }
    };
    const onPopState = () => startTransition(() => setActiveSection(sectionFromPath(window.location.pathname)));
    window.addEventListener("keydown", onKeyDown); window.addEventListener("popstate", onPopState);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("popstate", onPopState); };
  }, []);

  const go = (section: Section) => {
    startTransition(() => setActiveSection(section)); setMobileMenu(false);
    if (window.location.pathname !== sectionPaths[section]) window.history.pushState({}, "", sectionPaths[section]);
    window.scrollTo({ top: 0, behavior: state.preferences.reduceMotion ? "auto" : "smooth" });
  };
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next); document.documentElement.dataset.theme = next; document.documentElement.style.colorScheme = next; window.localStorage.setItem("personal-os-theme", next);
  };
  const openCapture = (type: CaptureType = "task", options?: Partial<Omit<CaptureConfig, "type">>) => setCaptureConfig({ type, mode: "single", taskCategory: "todo", workspace: "GENEL", ...options });
  const openRebuildArea = (area: string) => {
    startTransition(() => setActiveSection("career")); setMobileMenu(false);
    const url = `/career?area=${encodeURIComponent(area)}`;
    if (`${window.location.pathname}${window.location.search}` !== url) window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0, behavior: state.preferences.reduceMotion ? "auto" : "smooth" });
  };
  const toggleTask = (id: string) => setState((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : undefined, updatedAt: new Date().toISOString() } : task) }));
  const selectedProject = state.projects.find((project) => project.id === selectedProjectId) ?? null;

  return <div className="os-app" data-section={activeSection}>
    <div className="os-ambient" aria-hidden="true"><i /><i /><i /></div>
    <Sidebar active={activeSection} open={mobileMenu} go={go} close={() => setMobileMenu(false)} capture={() => openCapture("task", { mode: "organize" })} openVoiceRecorder={() => openRebuildArea("diction")} theme={theme} toggleTheme={toggleTheme} syncState={syncState} />
    {mobileMenu && <button className="os-menu-scrim" onClick={() => setMobileMenu(false)} aria-label="Menüyü kapat" />}
    <main className="os-main"><TopBar title={sectionMeta[activeSection].title} menu={() => setMobileMenu(true)} search={() => setCommandOpen(true)} capture={() => openCapture("task")} /><div className={activeSection === "home" ? "os-page os-home-page" : "os-page"}>
      <Suspense fallback={<div className="os-screen-loading" role="status"><i /><span>Bölüm hazırlanıyor</span></div>}>
        {activeSection === "home" && <HomeScreen state={state} toggleTask={toggleTask} openCapture={openCapture} openQuickCapture={() => openCapture("task", { mode: "organize" })} openProject={setSelectedProjectId} go={go} />}
        {activeSection === "projects" && <ProjectsScreen state={state} setState={setState} openProject={setSelectedProjectId} openCapture={() => openCapture("project")} />}
        {activeSection === "tasks" && <TasksScreen state={state} setState={setState} openCapture={(taskCategory) => openCapture("task", { taskCategory })} />}
        {activeSection === "calendar" && <CalendarScreen state={state} setState={setState} openCapture={() => openCapture("task")} />}
        {activeSection === "career" && <RebuildScreen state={state} setState={setState} go={go} initialArea={initialRebuildArea} />}
        {activeSection === "work" && <WorkScreen state={state} setState={setState} openCapture={(workspace) => openCapture("work", { workspace })} />}
        {activeSection === "notes" && <NotesScreen state={state} setState={setState} openCapture={() => openCapture("note")} />}
        {activeSection === "archive" && <ArchiveScreen state={state} setState={setState} />}
        {activeSection === "settings" && <SettingsScreen state={state} setState={setState} syncState={syncState} theme={theme} toggleTheme={toggleTheme} />}
      </Suspense>
    </div></main>
    <MobileNavigation active={activeSection} go={go} capture={() => openCapture("task", { mode: "organize" })} />
    <Suspense fallback={null}>
      {commandOpen && <CommandPalette state={state} close={() => setCommandOpen(false)} go={go} capture={(type) => { setCommandOpen(false); openCapture(type); }} openProject={setSelectedProjectId} openRebuildArea={openRebuildArea} />}
      {captureConfig && <CaptureSheet initialType={captureConfig.type} initialMode={captureConfig.mode} initialTaskCategory={captureConfig.taskCategory} initialWorkspace={captureConfig.workspace} state={state} setState={setState} close={() => setCaptureConfig(null)} />}
      {selectedProject && <ProjectDetailSheet project={selectedProject} setState={setState} close={() => setSelectedProjectId(null)} />}
    </Suspense>
  </div>;
}
