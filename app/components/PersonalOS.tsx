"use client";

import {
  Archive,
  ArrowRight,
  Atom,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDot,
  ClipboardCheck,
  Clock3,
  Command,
  Compass,
  Dumbbell,
  Edit3,
  ExternalLink,
  FileText,
  Folder,
  GripVertical,
  Languages,
  List,
  Menu,
  MessageCircle,
  Mic2,
  MoreHorizontal,
  Orbit,
  PanelLeftClose,
  Plus,
  Radar,
  RefreshCcw,
  Rocket,
  Search,
  Settings,
  Sparkles,
  Star,
  SunMedium,
  Target,
  Telescope,
  X,
  type LucideIcon,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createSeedState } from "@/lib/seed";
import type {
  CuriosityQuestion,
  Note,
  PersonalOSState,
  Priority,
  Project,
  ProjectStatus,
  Task,
  TaskCategory,
  WeeklyTarget,
  WorkNote,
} from "@/lib/types";

type Section =
  | "home"
  | "projects"
  | "tasks"
  | "calendar"
  | "career"
  | "work"
  | "notes"
  | "archive"
  | "settings";

type CaptureType = "task" | "note" | "project" | "work" | "research";

const sectionPaths: Record<Section, string> = {
  home: "/",
  projects: "/projects",
  tasks: "/tasks",
  calendar: "/calendar",
  career: "/career",
  work: "/work",
  notes: "/notes",
  archive: "/archive",
  settings: "/settings",
};

const navPrimary: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Ana Merkez", icon: Radar },
  { id: "projects", label: "Projeler", icon: Orbit },
  { id: "tasks", label: "Görevler", icon: ClipboardCheck },
  { id: "calendar", label: "Takvim", icon: CalendarDays },
  { id: "career", label: "Rebuild", icon: Rocket },
  { id: "work", label: "İş", icon: BriefcaseBusiness },
  { id: "notes", label: "Notlar", icon: BookOpen },
];

const navSecondary: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: "archive", label: "Arşiv", icon: Archive },
  { id: "settings", label: "Ayarlar", icon: Settings },
];

const sectionMeta: Record<Section, { eyebrow: string; title: string; description: string }> = {
  home: {
    eyebrow: "KOMUTA MERKEZİ / 01",
    title: "Bugün ne önemli?",
    description: "Günün yönünü belirle, sonra tek bir sonraki adıma odaklan.",
  },
  projects: {
    eyebrow: "MİSYON KONTROL / 02",
    title: "Projeler",
    description: "Aktif işleri, açık sonraki adımları ve ilerlemeyi aynı yüzeyde yönet.",
  },
  tasks: {
    eyebrow: "GÜNLÜK OPERASYON / 03",
    title: "Görevler",
    description: "Yapılacaklar, alınacaklar ve keşfedilecek yerler — birbirine karışmadan.",
  },
  calendar: {
    eyebrow: "ZAMAN HARİTASI / 04",
    title: "Takvim",
    description: "Ayın tamamını gör; bir güne dokununca ayrıntıya in.",
  },
  career: {
    eyebrow: "REBUILD PROGRAMI / 05",
    title: "Rebuild",
    description: "Daha üretken olmak için değil, daha ilginç bir hayat kurmak için altı aylık deney.",
  },
  work: {
    eyebrow: "KIBLETEYN / 06",
    title: "İş Alanı",
    description: "Profesyonel notlar ve teslimler için sakin, ayrı bir çalışma yüzeyi.",
  },
  notes: {
    eyebrow: "BİLGİ ARŞİVİ / 07",
    title: "Notlar",
    description: "Araştırmayı, fikirleri ve öğrenilenleri hiyerarşik bir saha defterinde tut.",
  },
  archive: {
    eyebrow: "ARŞİV / 08",
    title: "Tamamlananlar",
    description: "Geride bırakılan işleri kaybetmeden görünür geçmişe dönüştür.",
  },
  settings: {
    eyebrow: "SİSTEM / 09",
    title: "Ayarlar",
    description: "Sistemin davranışını, kayıt durumunu ve tercihlerini gözden geçir.",
  },
};

const statusLabels: Record<ProjectStatus, string> = {
  backlog: "BACKLOG",
  todo: "YAPILACAK",
  progress: "DEVAM EDİYOR",
  review: "İNCELEME",
  done: "TAMAMLANDI",
};

const priorityLabels: Record<Priority, string> = {
  low: "Düşük",
  medium: "Normal",
  high: "Yüksek",
};

const monthNames = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const todayIso = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function formatDate(value?: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "Tarih yok";
  return new Intl.DateTimeFormat("tr-TR", options ?? { day: "numeric", month: "short" }).format(
    new Date(`${value}T12:00:00`),
  );
}

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function PersonalOS({ initialSection = "home" }: { initialSection?: Section }) {
  const [activeSection, setActiveSection] = useState<Section>(initialSection);
  const [state, setState] = useState<PersonalOSState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);
  const [syncState, setSyncState] = useState<"loading" | "saved" | "saving" | "offline">("loading");
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureType, setCaptureType] = useState<CaptureType>("task");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const pendingSave = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/state")
      .then(async (response) => {
        if (!response.ok) throw new Error("state unavailable");
        return (await response.json()) as { state: PersonalOSState };
      })
      .then((payload) => {
        if (!alive) return;
        setState(payload.state);
        setSyncState("saved");
      })
      .catch(() => {
        if (alive) setSyncState("offline");
      })
      .finally(() => {
        if (alive) setHydrated(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (pendingSave.current) clearTimeout(pendingSave.current);
    setSyncState("saving");
    pendingSave.current = setTimeout(() => {
      fetch("/api/state", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("save failed");
          setSyncState("saved");
        })
        .catch(() => setSyncState("offline"));
    }, 750);
    return () => {
      if (pendingSave.current) clearTimeout(pendingSave.current);
    };
  }, [state, hydrated]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setCaptureOpen(false);
        setSelectedProjectId(null);
      }
    };
    const onPop = () => {
      const segment = window.location.pathname.split("/")[1] || "home";
      const match = Object.entries(sectionPaths).find(([, path]) => path === `/${segment}` || (path === "/" && !segment));
      setActiveSection((match?.[0] as Section) ?? "home");
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  const go = (section: Section) => {
    setActiveSection(section);
    setMobileMenu(false);
    window.history.pushState({}, "", sectionPaths[section]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openCapture = (type: CaptureType = "task") => {
    setCaptureType(type);
    setCaptureOpen(true);
  };

  const toggleTask = (taskId: string) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    }));
  };

  const toggleProjectSubtask = (projectId: string, subtaskId: string) => {
    setState((current) => ({
      ...current,
      projects: current.projects.map((project) => {
        if (project.id !== projectId) return project;
        const subtasks = project.subtasks.map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask,
        );
        const progress = subtasks.length
          ? Math.round((subtasks.filter((subtask) => subtask.completed).length / subtasks.length) * 100)
          : project.progress;
        return { ...project, subtasks, progress };
      }),
    }));
  };

  const selectedProject = state.projects.find((project) => project.id === selectedProjectId) ?? null;
  const meta = sectionMeta[activeSection];

  return (
    <div className={classNames("app-frame", sidebarCompact && "is-compact")}>
      <Sidebar
        active={activeSection}
        compact={sidebarCompact}
        mobileOpen={mobileMenu}
        go={go}
        onCompact={() => setSidebarCompact((value) => !value)}
        onClose={() => setMobileMenu(false)}
      />

      <main className="main-shell">
        <TopBar
          syncState={syncState}
          onSearch={() => setCommandOpen(true)}
          onCapture={() => openCapture("task")}
          onMenu={() => setMobileMenu(true)}
        />
        <div className={classNames("page", activeSection === "calendar" && "page-calendar")}>
          <PageHeader meta={meta} onCapture={() => openCapture(activeSection === "projects" ? "project" : activeSection === "notes" ? "note" : activeSection === "work" ? "work" : "task")} />

          {activeSection === "home" && (
            <HomePage
              state={state}
              setState={setState}
              toggleTask={toggleTask}
              openCapture={openCapture}
              openProject={setSelectedProjectId}
              go={go}
            />
          )}
          {activeSection === "projects" && (
            <ProjectsPage
              projects={state.projects}
              setState={setState}
              openProject={setSelectedProjectId}
              openCapture={() => openCapture("project")}
            />
          )}
          {activeSection === "tasks" && (
            <TasksPage tasks={state.tasks} projects={state.projects} toggleTask={toggleTask} openCapture={() => openCapture("task")} />
          )}
          {activeSection === "calendar" && (
            <CalendarPage state={state} setState={setState} openCapture={() => openCapture("task")} />
          )}
          {activeSection === "career" && <CareerPage state={state} setState={setState} go={go} />}
          {activeSection === "work" && <WorkPage state={state} setState={setState} openCapture={() => openCapture("work")} />}
          {activeSection === "notes" && <NotesPage state={state} setState={setState} openCapture={() => openCapture("note")} />}
          {activeSection === "archive" && <ArchivePage state={state} />}
          {activeSection === "settings" && <SettingsPage syncState={syncState} state={state} />}
        </div>
      </main>

      <MobileNav active={activeSection} go={go} />

      {commandOpen && (
        <CommandPalette
          state={state}
          onClose={() => setCommandOpen(false)}
          go={go}
          openCapture={(type) => {
            setCommandOpen(false);
            openCapture(type);
          }}
          openProject={(id) => {
            setCommandOpen(false);
            go("projects");
            setSelectedProjectId(id);
          }}
        />
      )}
      {captureOpen && (
        <CaptureDialog
          type={captureType}
          setType={setCaptureType}
          state={state}
          setState={setState}
          onClose={() => setCaptureOpen(false)}
        />
      )}
      {selectedProject && (
        <ProjectDrawer
          project={selectedProject}
          onClose={() => setSelectedProjectId(null)}
          onToggleSubtask={(subtaskId) => toggleProjectSubtask(selectedProject.id, subtaskId)}
          setState={setState}
        />
      )}
    </div>
  );
}

function Sidebar({
  active,
  compact,
  mobileOpen,
  go,
  onCompact,
  onClose,
}: {
  active: Section;
  compact: boolean;
  mobileOpen: boolean;
  go: (section: Section) => void;
  onCompact: () => void;
  onClose: () => void;
}) {
  const renderLink = (item: { id: Section; label: string; icon: LucideIcon }) => {
    const Icon = item.icon;
    return (
      <a
        key={item.id}
        href={sectionPaths[item.id]}
        className={classNames("nav-link", active === item.id && "is-active")}
        onClick={(event) => {
          event.preventDefault();
          go(item.id);
        }}
        aria-current={active === item.id ? "page" : undefined}
        title={compact ? item.label : undefined}
      >
        <Icon aria-hidden="true" />
        <span>{item.label}</span>
        {active === item.id && <span className="nav-signal" aria-hidden="true" />}
      </a>
    );
  };

  return (
    <aside className={classNames("sidebar", mobileOpen && "is-mobile-open")}>
      <div className="brand-row">
        <div className="brand-mark" aria-hidden="true">
          <Orbit />
          <span />
        </div>
        <div className="brand-type">
          <strong>PERSONAL OS</strong>
          <span>FIELD SYSTEM / 01</span>
        </div>
        <button className="icon-button sidebar-close" onClick={onClose} aria-label="Menüyü kapat">
          <X />
        </button>
      </div>

      <div className="system-status">
        <span className="status-light" />
        <div>
          <strong>SİSTEM AKTİF</strong>
          <span>YEREL KAYIT / HAZIR</span>
        </div>
      </div>

      <nav className="side-nav" aria-label="Ana navigasyon">
        <span className="nav-label">ANA ALANLAR</span>
        {navPrimary.map(renderLink)}
        <span className="nav-label secondary-label">SİSTEM</span>
        {navSecondary.map(renderLink)}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-mission">
          <span>AKTİF FAZ</span>
          <strong>REACTIVATION</strong>
          <div className="mini-progress"><span style={{ width: "34%" }} /></div>
          <small>AY 1 / 6</small>
        </div>
        <button className="collapse-button" onClick={onCompact} aria-label={compact ? "Menüyü genişlet" : "Menüyü daralt"}>
          <PanelLeftClose />
          <span>{compact ? "Genişlet" : "Daralt"}</span>
        </button>
      </div>
    </aside>
  );
}

function TopBar({
  syncState,
  onSearch,
  onCapture,
  onMenu,
}: {
  syncState: "loading" | "saved" | "saving" | "offline";
  onSearch: () => void;
  onCapture: () => void;
  onMenu: () => void;
}) {
  const syncLabels = {
    loading: "Yükleniyor",
    saved: "Kaydedildi",
    saving: "Kaydediliyor",
    offline: "Çevrimdışı önizleme",
  };
  return (
    <div className="topbar">
      <button className="icon-button mobile-menu-button" onClick={onMenu} aria-label="Menüyü aç">
        <Menu />
      </button>
      <button className="search-trigger" onClick={onSearch}>
        <Search />
        <span>Her yerde ara</span>
        <kbd>⌘ K</kbd>
      </button>
      <div className="topbar-right">
        <span className={classNames("sync-status", `is-${syncState}`)}>
          <span /> {syncLabels[syncState]}
        </span>
        <span className="topbar-date">
          {new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date())}
        </span>
        <button className="primary-action compact-action" onClick={onCapture}>
          <Plus /> <span>Hızlı Ekle</span>
        </button>
      </div>
    </div>
  );
}

function PageHeader({
  meta,
  onCapture,
}: {
  meta: { eyebrow: string; title: string; description: string };
  onCapture: () => void;
}) {
  return (
    <header className="page-header">
      <div>
        <span className="eyebrow"><span className="eyebrow-line" />{meta.eyebrow}</span>
        <h1>{meta.title}</h1>
        <p>{meta.description}</p>
      </div>
      <button className="secondary-action page-quick-add" onClick={onCapture}>
        <Plus /> Yeni Kayıt
      </button>
    </header>
  );
}

function HomePage({
  state,
  setState,
  toggleTask,
  openCapture,
  openProject,
  go,
}: {
  state: PersonalOSState;
  setState: React.Dispatch<React.SetStateAction<PersonalOSState>>;
  toggleTask: (id: string) => void;
  openCapture: (type: CaptureType) => void;
  openProject: (id: string) => void;
  go: (section: Section) => void;
}) {
  const [captureText, setCaptureText] = useState("");
  const [captureType, setCaptureType] = useState<CaptureType>("task");
  const todayTasks = state.tasks.filter((task) => task.date === todayIso()).slice(0, 5);
  const activeProjects = state.projects.filter((project) => project.status !== "done").slice(0, 3);

  const submitQuickCapture = (event: FormEvent) => {
    event.preventDefault();
    const title = captureText.trim();
    if (!title) return;
    if (captureType === "task") {
      const task: Task = { id: uid("task"), title, category: "todo", completed: false, priority: "medium", date: todayIso(), subtasks: [] };
      setState((current) => ({ ...current, tasks: [task, ...current.tasks] }));
    } else if (captureType === "project") {
      const project: Project = {
        id: uid("project"), title: title.toUpperCase(), category: "YENİ MİSYON", description: "Hızlı yakalamadan oluşturuldu.", status: "backlog", priority: "medium", startDate: todayIso(), progress: 0, tags: [], nextAction: "İlk somut adımı tanımla", subtasks: [],
      };
      setState((current) => ({ ...current, projects: [project, ...current.projects] }));
    } else {
      const note: Note = {
        id: uid("note"), title, folder: captureType === "work" ? "İŞ / Hızlı Not" : captureType === "research" ? "ARAŞTIRMA / Gelen Kutusu" : "GELEN KUTUSU", content: "", tags: captureType === "research" ? ["araştırma"] : [], favorite: false, archived: false, updatedAt: todayIso(),
      };
      setState((current) => ({ ...current, notes: [note, ...current.notes] }));
    }
    setCaptureText("");
  };

  return (
    <div className="home-grid">
      <section className="panel today-panel">
        <SectionTitle code="TODAY" title="Bugünün rotası" action="Tüm görevler" onAction={() => go("tasks")} />
        <div className="task-stack">
          {todayTasks.length ? todayTasks.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} project={state.projects.find((project) => project.id === task.projectId)} />
          )) : (
            <EmptyState icon={SunMedium} title="BUGÜN AÇIK GÖREV YOK" text="İstersen günün ilk net adımını ekle." action="Görev ekle" onAction={() => openCapture("task")} />
          )}
        </div>
      </section>

      <section className="panel quick-capture-panel">
        <SectionTitle code="CAPTURE" title="Hızlı yakala" />
        <form className="capture-form" onSubmit={submitQuickCapture}>
          <label htmlFor="quick-capture">Aklında ne var?</label>
          <textarea id="quick-capture" value={captureText} onChange={(event) => setCaptureText(event.target.value)} placeholder="Bir sonraki görev, fikir veya araştırma sorusu…" rows={3} />
          <div className="capture-types" aria-label="Kayıt türü">
            {([
              ["task", "Görev"], ["note", "Not"], ["project", "Proje"], ["work", "İş notu"], ["research", "Araştırma"],
            ] as [CaptureType, string][]).map(([type, label]) => (
              <button key={type} type="button" className={captureType === type ? "is-active" : ""} onClick={() => setCaptureType(type)}>{label}</button>
            ))}
          </div>
          <div className="capture-submit-row">
            <span>Ctrl + Enter ile hızlı kayıt</span>
            <button className="primary-action" type="submit" disabled={!captureText.trim()}><Plus /> Kaydet</button>
          </div>
        </form>
      </section>

      <section className="panel missions-panel">
        <SectionTitle code="MISSIONS" title="Aktif projeler" action="Proje panosu" onAction={() => go("projects")} />
        <div className="mission-list">
          {activeProjects.map((project, index) => (
            <button className="mission-row" key={project.id} onClick={() => openProject(project.id)}>
              <span className="mission-index">0{index + 1}</span>
              <div className="mission-main">
                <span className="mission-category">{project.category}</span>
                <strong>{project.title}</strong>
                <div className="mission-next"><span>NEXT</span>{project.nextAction}</div>
              </div>
              <div className="mission-progress-wrap">
                <strong>{project.progress}%</strong>
                <Meter value={project.progress} />
                <small>{project.dueDate ? formatDate(project.dueDate) : "Açık tarih"}</small>
              </div>
              <ArrowRight className="mission-arrow" />
            </button>
          ))}
        </div>
      </section>

      <section className="panel week-panel">
        <SectionTitle code="WEEK 01" title="Bu hafta" action="Rebuild'i aç" onAction={() => go("career")} />
        <div className="week-summary">
          <div className="week-score">
            <span>GENEL RİTİM</span>
            <strong>{Math.round(state.weeklyTargets.reduce((sum, item) => sum + Math.min(item.current / item.target, 1), 0) / state.weeklyTargets.length * 100)}%</strong>
            <small>Sonuç değil, yön göstergesi</small>
          </div>
          <div className="week-target-grid">
            {state.weeklyTargets.slice(0, 6).map((target) => <WeeklyTargetMini key={target.id} target={target} />)}
          </div>
        </div>
      </section>

      <section className="panel continue-panel">
        <SectionTitle code="CONTINUE" title="Buradan devam et" />
        <div className="continue-grid">
          <ContinueItem icon={Orbit} kicker="PROJE" title="Orbit Explorer" detail="Hız görselleştirmesini uygula" action={() => openProject("project-orbit")} />
          <ContinueItem icon={Languages} kicker="ENGLISH" title="15 dakikalık anlatım" detail="Titan atmosferini İngilizce açıkla" action={() => go("career")} />
          <ContinueItem icon={Telescope} kicker="MERAK" title="Haftalık araştırma" detail="Somut bir soruyla yeni misyon başlat" action={() => go("career")} />
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ code, title, action, onAction }: { code: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="section-title-row">
      <div><span>{code}</span><h2>{title}</h2></div>
      {action && <button className="text-action" onClick={onAction}>{action}<ArrowRight /></button>}
    </div>
  );
}

function TaskRow({ task, project, onToggle }: { task: Task; project?: Project; onToggle: () => void }) {
  return (
    <div className={classNames("task-row", task.completed && "is-complete")}>
      <button className="check-button" onClick={onToggle} aria-label={task.completed ? `${task.title} görevini yeniden aç` : `${task.title} görevini tamamla`}>
        {task.completed ? <Check /> : <Circle />}
      </button>
      <div className="task-row-main">
        <strong>{task.title}</strong>
        <span>{project?.title ?? task.recurrence ?? "Kişisel"}</span>
      </div>
      {task.time && <span className="task-time"><Clock3 />{task.time}</span>}
      <span className={classNames("priority-mark", `is-${task.priority}`)}>{priorityLabels[task.priority]}</span>
      <button className="icon-button subtle" aria-label="Görev seçenekleri"><MoreHorizontal /></button>
    </div>
  );
}

function WeeklyTargetMini({ target }: { target: WeeklyTarget }) {
  const ratio = Math.min((target.current / target.target) * 100, 100);
  return (
    <div className={classNames("target-mini", `tone-${target.tone}`)}>
      <div><span>{target.shortLabel}</span><strong>{target.current} / {target.target}</strong></div>
      <div className="target-track"><span style={{ width: `${ratio}%` }} /></div>
      <small>{target.unit}</small>
    </div>
  );
}

function ContinueItem({ icon: Icon, kicker, title, detail, action }: { icon: LucideIcon; kicker: string; title: string; detail: string; action: () => void }) {
  return (
    <button className="continue-item" onClick={action}>
      <span className="continue-icon"><Icon /></span>
      <span className="continue-copy"><small>{kicker}</small><strong>{title}</strong><span>{detail}</span></span>
      <ArrowRight />
    </button>
  );
}

function Meter({ value }: { value: number }) {
  return <div className="meter" aria-label={`İlerleme yüzde ${value}`}><span style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} /></div>;
}

function ProjectsPage({
  projects,
  setState,
  openProject,
  openCapture,
}: {
  projects: Project[];
  setState: React.Dispatch<React.SetStateAction<PersonalOSState>>;
  openProject: (id: string) => void;
  openCapture: () => void;
}) {
  const [view, setView] = useState<"board" | "list">("board");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const columns: ProjectStatus[] = ["backlog", "todo", "progress", "review", "done"];

  const moveProject = (id: string, status: ProjectStatus) => {
    setState((current) => ({ ...current, projects: current.projects.map((project) => project.id === id ? { ...project, status } : project) }));
    setDraggedId(null);
  };

  return (
    <div className="projects-view">
      <div className="view-toolbar">
        <div className="segmented-control">
          <button className={view === "board" ? "is-active" : ""} onClick={() => setView("board")}><GripVertical /> Pano</button>
          <button className={view === "list" ? "is-active" : ""} onClick={() => setView("list")}><List /> Liste</button>
        </div>
        <div className="toolbar-info"><CircleDot /> {projects.filter((project) => project.status !== "done").length} aktif misyon</div>
        <button className="primary-action" onClick={openCapture}><Plus /> Yeni Proje</button>
      </div>

      {view === "board" ? (
        <div className="project-board" aria-label="Proje panosu">
          {columns.map((status) => {
            const cards = projects.filter((project) => project.status === status);
            return (
              <section
                className={classNames("board-column", draggedId && "is-drop-ready")}
                key={status}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => draggedId && moveProject(draggedId, status)}
              >
                <div className="column-header">
                  <span className={`column-dot is-${status}`} />
                  <strong>{statusLabels[status]}</strong>
                  <span>{cards.length.toString().padStart(2, "0")}</span>
                  <button className="icon-button subtle" onClick={openCapture} aria-label={`${statusLabels[status]} sütununa proje ekle`}><Plus /></button>
                </div>
                <div className="column-cards">
                  {cards.map((project) => (
                    <article
                      className="project-card"
                      key={project.id}
                      draggable
                      onDragStart={() => setDraggedId(project.id)}
                      onDragEnd={() => setDraggedId(null)}
                      onClick={() => openProject(project.id)}
                    >
                      <div className="card-topline"><span>{project.category}</span><GripVertical /></div>
                      <h3>{project.title}</h3>
                      <p>{project.nextAction}</p>
                      <div className="card-progress-line"><Meter value={project.progress} /><strong>{project.progress}%</strong></div>
                      <div className="card-meta">
                        <span><CheckCircle2 />{project.subtasks.filter((item) => item.completed).length}/{project.subtasks.length}</span>
                        {project.dueDate && <span><CalendarDays />{formatDate(project.dueDate)}</span>}
                      </div>
                    </article>
                  ))}
                  {!cards.length && <button className="column-empty" onClick={openCapture}><Plus /> İlk misyonu ekle</button>}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="project-table-wrap">
          <table className="project-table">
            <thead><tr><th>Proje</th><th>Durum</th><th>Öncelik</th><th>İlerleme</th><th>Son tarih</th><th>Sonraki adım</th></tr></thead>
            <tbody>{projects.map((project) => (
              <tr key={project.id} onClick={() => openProject(project.id)}>
                <td><span className="table-category">{project.category}</span><strong>{project.title}</strong></td>
                <td><span className={`status-pill is-${project.status}`}>{statusLabels[project.status]}</span></td>
                <td>{priorityLabels[project.priority]}</td>
                <td><div className="table-progress"><Meter value={project.progress} /><span>{project.progress}%</span></div></td>
                <td>{project.dueDate ? formatDate(project.dueDate) : "—"}</td>
                <td>{project.nextAction}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TasksPage({ tasks, projects, toggleTask, openCapture }: { tasks: Task[]; projects: Project[]; toggleTask: (id: string) => void; openCapture: () => void }) {
  const [category, setCategory] = useState<TaskCategory>("todo");
  const [filter, setFilter] = useState<"open" | "all" | "done">("open");
  const categoryMeta: Record<TaskCategory, { label: string; description: string; empty: string }> = {
    todo: { label: "YAPILACAK", description: "Günlük işler ve net sonraki adımlar", empty: "Açık görev kalmadı" },
    purchase: { label: "ALINACAK", description: "Unutmadan, acele etmeden", empty: "Alınacak bir şey yok" },
    place: { label: "GEZİLECEK", description: "Yerler, rotalar ve deneyimler", empty: "Yeni bir rota ekle" },
  };
  const visible = tasks.filter((task) => task.category === category && (filter === "all" || (filter === "done" ? task.completed : !task.completed)));

  return (
    <div className="tasks-layout">
      <div className="category-tabs">
        {(Object.keys(categoryMeta) as TaskCategory[]).map((key) => (
          <button key={key} className={category === key ? "is-active" : ""} onClick={() => setCategory(key)}>
            <span>{categoryMeta[key].label}</span><small>{categoryMeta[key].description}</small><b>{tasks.filter((task) => task.category === key && !task.completed).length}</b>
          </button>
        ))}
      </div>
      <section className="panel task-list-panel">
        <div className="task-list-heading">
          <div><span>{categoryMeta[category].label}</span><h2>{category === "todo" ? "Açık görevler" : category === "purchase" ? "Satın alma listesi" : "Keşif listesi"}</h2></div>
          <div className="task-filter">
            {(["open", "all", "done"] as const).map((value) => <button key={value} className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)}>{value === "open" ? "Açık" : value === "all" ? "Tümü" : "Tamamlanan"}</button>)}
          </div>
        </div>
        <div className="detailed-task-list">
          {visible.map((task) => (
            <div className={classNames("detailed-task", task.completed && "is-complete")} key={task.id}>
              <button className="check-button large" onClick={() => toggleTask(task.id)}>{task.completed ? <Check /> : <Circle />}</button>
              <div className="detailed-task-main">
                <strong>{task.title}</strong>
                <div>
                  {task.projectId && <span><Orbit />{projects.find((project) => project.id === task.projectId)?.title}</span>}
                  {task.city && <span><Compass />{task.city} · {task.placeType}</span>}
                  {task.estimate && <span className="price-tag">{task.estimate}</span>}
                  {task.recurrence && <span><RefreshCcw />{task.recurrence}</span>}
                </div>
                {task.notes && <p>{task.notes}</p>}
              </div>
              <div className="detailed-task-side">
                {task.date && <span><CalendarDays />{formatDate(task.date)}</span>}
                {task.time && <span><Clock3 />{task.time}</span>}
                <span className={classNames("priority-mark", `is-${task.priority}`)}>{priorityLabels[task.priority]}</span>
              </div>
            </div>
          ))}
          {!visible.length && <EmptyState icon={category === "place" ? Compass : category === "purchase" ? Target : CheckCircle2} title={categoryMeta[category].empty.toUpperCase()} text="Listeyi küçük ve anlamlı tutabilirsin." action="Yeni kayıt" onAction={openCapture} />}
        </div>
        <button className="inline-add" onClick={openCapture}><Plus /> {category === "todo" ? "Görev ekle" : category === "purchase" ? "Alınacak ekle" : "Yer ekle"}</button>
      </section>
    </div>
  );
}

function CalendarPage({ state, setState, openCapture }: { state: PersonalOSState; setState: React.Dispatch<React.SetStateAction<PersonalOSState>>; openCapture: () => void }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [newTitle, setNewTitle] = useState("");
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const mondayIndex = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - mondayIndex);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      return { date, iso: local, currentMonth: date.getMonth() === cursor.getMonth() };
    });
  }, [cursor]);
  const selectedItems = state.calendarItems.filter((item) => item.date === selectedDate);

  const addCalendarItem = (event: FormEvent) => {
    event.preventDefault();
    if (!newTitle.trim()) return;
    setState((current) => ({ ...current, calendarItems: [...current.calendarItems, { id: uid("cal"), title: newTitle.trim(), date: selectedDate, type: "personal" }] }));
    setNewTitle("");
  };

  return (
    <div className="calendar-layout">
      <section className="calendar-main">
        <div className="calendar-toolbar">
          <div className="month-title"><span>MONTH VIEW</span><h2>{monthNames[cursor.getMonth()]} {cursor.getFullYear()}</h2></div>
          <div className="calendar-controls">
            <button className="secondary-action" onClick={() => { const now = new Date(); setCursor(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDate(todayIso()); }}>Bugün</button>
            <button className="icon-button bordered" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="Önceki ay"><ChevronLeft /></button>
            <button className="icon-button bordered" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="Sonraki ay"><ChevronRight /></button>
          </div>
        </div>
        <div className="calendar-weekdays">{dayNames.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="calendar-grid">
          {cells.map((cell) => {
            const items = state.calendarItems.filter((item) => item.date === cell.iso);
            return (
              <button key={cell.iso} className={classNames("calendar-cell", !cell.currentMonth && "is-other-month", cell.iso === todayIso() && "is-today", cell.iso === selectedDate && "is-selected")} onClick={() => setSelectedDate(cell.iso)}>
                <span className="day-number">{cell.date.getDate()}</span>
                <div className="cell-items">{items.slice(0, 3).map((item) => <span className={`calendar-item is-${item.type}`} key={item.id}><i />{item.time && <b>{item.time}</b>}{item.title}</span>)}{items.length > 3 && <small>+{items.length - 3} daha</small>}</div>
              </button>
            );
          })}
        </div>
      </section>
      <aside className="day-panel">
        <div className="day-panel-header"><span>SEÇİLİ GÜN</span><strong>{formatDate(selectedDate, { weekday: "long", day: "numeric", month: "long" })}</strong></div>
        <div className="day-timeline">
          {selectedItems.map((item) => (
            <div className={`day-item is-${item.type}`} key={item.id}><span className="timeline-dot" /><div><small>{item.time ?? "Gün boyu"}</small><strong>{item.title}</strong><span>{item.type === "work" ? "İş" : item.type === "project" ? "Proje" : item.type === "event" ? "Etkinlik" : "Kişisel"}</span></div></div>
          ))}
          {!selectedItems.length && <EmptyState icon={CalendarDays} title="PLANLANMIŞ KAYIT YOK" text="Bu güne küçük bir plan ekleyebilirsin." />}
        </div>
        <form className="day-quick-add" onSubmit={addCalendarItem}><input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Bu güne bir şey ekle…" /><button className="icon-button primary-icon" aria-label="Takvime ekle"><Plus /></button></form>
        <button className="secondary-action full-width" onClick={openCapture}><Plus /> Ayrıntılı kayıt oluştur</button>
      </aside>
    </div>
  );
}

function CareerPage({ state, setState, go }: { state: PersonalOSState; setState: React.Dispatch<React.SetStateAction<PersonalOSState>>; go: (section: Section) => void }) {
  const [deckOffset, setDeckOffset] = useState(0);
  const [creativeOffset, setCreativeOffset] = useState(0);
  const deck = useMemo(() => {
    const questions = [...state.curiosityQuestions];
    return Array.from({ length: Math.min(6, questions.length) }, (_, index) => questions[(deckOffset + index) % questions.length]);
  }, [deckOffset, state.curiosityQuestions]);
  const creative = state.creativeIdeas[creativeOffset % state.creativeIdeas.length];

  const chooseQuestion = (question: CuriosityQuestion) => {
    setState((current) => ({
      ...current,
      curiosityMission: { id: uid("mission"), questionId: question.id, question: question.question, startedAt: todayIso(), stage: "explore" },
      recentQuestionIds: [question.id, ...current.recentQuestionIds.filter((id) => id !== question.id)].slice(0, 8),
      weeklyTargets: current.weeklyTargets.map((target) => target.id === "weekly-curiosity" ? { ...target, current: 1 } : target),
    }));
  };

  const advanceMission = (stage: "explore" | "understand" | "create" | "explain" | "complete") => {
    setState((current) => current.curiosityMission ? { ...current, curiosityMission: { ...current.curiosityMission, stage } } : current);
  };

  const logWorkout = () => {
    setState((current) => ({
      ...current,
      weeklyTargets: current.weeklyTargets.map((target) => target.id === "weekly-sport" ? { ...target, current: Math.min(target.current + 1, target.target) } : target),
      activityLogs: [{ id: uid("log"), area: "body", title: "Antrenman", date: todayIso(), duration: 45 }, ...current.activityLogs],
    }));
  };

  const startCreativeProject = () => {
    const project: Project = { id: uid("project"), title: creative.title, category: "YARATICI / LAB", description: creative.description, status: "todo", priority: "medium", startDate: todayIso(), progress: 0, tags: ["yaratıcı deney"], nextAction: "İlk 20 dakikalık eskizi hazırla", subtasks: [{ id: uid("sub"), title: "Referansları seç", completed: false }, { id: uid("sub"), title: "İlk eskizi üret", completed: false }] };
    setState((current) => ({ ...current, projects: [project, ...current.projects] }));
    go("projects");
  };

  return (
    <div className="career-layout">
      <section className="rebuild-hero">
        <div className="rebuild-orbit" aria-hidden="true"><span className="orbit-ring ring-one" /><span className="orbit-ring ring-two" /><span className="orbit-core">01</span></div>
        <div className="rebuild-copy"><span>ALTI AYLIK PROGRAM</span><h2>REACTIVATION</h2><p>İlk ayın amacı performans değil; beden, merak ve iletişim için yeniden tutarlı bir ritim kurmak.</p><div className="rebuild-meta"><span>AY <strong>1 / 6</strong></span><span>MİSYON İLERLEMESİ <strong>34%</strong></span><span>HAFTA <strong>3</strong></span></div></div>
        <div className="rebuild-progress"><strong>34</strong><span>%</span><Meter value={34} /><small>Ritim kuruluyor</small></div>
      </section>

      <section className="weekly-dashboard panel">
        <SectionTitle code="WEEKLY SYSTEM" title="Bu haftanın ritmi" />
        <div className="weekly-full-grid">{state.weeklyTargets.map((target) => <WeeklyTargetCard key={target.id} target={target} />)}</div>
        <div className="history-strip"><span><b>Geçen hafta</b> {state.weeklyHistory[0]?.score}%</span><p>{state.weeklyHistory[0]?.summary}</p><button>Hafta geçmişi <ArrowRight /></button></div>
      </section>

      <section className="career-two-col">
        <div className="panel curiosity-panel">
          <div className="deck-heading"><div><span>CURIOSITY DECK</span><h2>Bugün neyi merak ediyorsun?</h2><p>Bir soruyu seç. Sistem onu boş sayfa bırakmadan haftalık araştırma akışına dönüştürecek.</p></div><button className="secondary-action" onClick={() => setDeckOffset((value) => (value + 6) % state.curiosityQuestions.length)}><RefreshCcw /> Farklı sorular</button></div>
          <div className="question-deck">{deck.map((question, index) => (
            <button className="question-card" key={question.id} onClick={() => chooseQuestion(question)}><span className="question-number">0{index + 1}</span><span className="question-category">{question.category}</span><strong>{question.question}</strong><span className="question-select">Bu soruyu seç <ArrowRight /></span></button>
          ))}</div>
        </div>

        <div className="panel mission-flow-panel">
          <SectionTitle code="ACTIVE CURIOSITY" title="Merak misyonu" />
          {state.curiosityMission ? (
            <div className="curiosity-mission">
              <span className="active-mission-label">AKTİF SORU</span><h3>{state.curiosityMission.question}</h3>
              <div className="mission-stages">{(["explore", "understand", "create", "explain"] as const).map((stage, index) => {
                const order = ["explore", "understand", "create", "explain", "complete"];
                const activeIndex = order.indexOf(state.curiosityMission!.stage);
                const labels = ["Keşfet", "Anla", "Üret", "Anlat"];
                return <button key={stage} className={classNames(index <= activeIndex && "is-reached", stage === state.curiosityMission!.stage && "is-active")} onClick={() => advanceMission(stage)}><span>{index + 1}</span>{labels[index]}</button>;
              })}</div>
              <div className="next-step-box">
                <span>ŞİMDİKİ ADIM</span>
                <strong>{state.curiosityMission.stage === "explore" ? "Soruyu 20 dakika keşfet" : state.curiosityMission.stage === "understand" ? "Anladığını kendi cümlelerinle yaz" : state.curiosityMission.stage === "create" ? "Bir çıktı türü seç ve küçük bir şey üret" : "Konuyu 5 dakika yüksek sesle anlat"}</strong>
                {state.curiosityMission.stage === "create" && <div className="creation-options">{["Diyagram", "Mini simülasyon", "Poster", "UI konsepti", "Zaman çizelgesi"].map((item) => <button key={item}>{item}</button>)}</div>}
                <button className="primary-action" onClick={() => advanceMission(state.curiosityMission!.stage === "explore" ? "understand" : state.curiosityMission!.stage === "understand" ? "create" : state.curiosityMission!.stage === "create" ? "explain" : "complete")}>Adımı tamamla <ArrowRight /></button>
              </div>
            </div>
          ) : <EmptyState icon={Telescope} title="HENÜZ BİR MERAK MİSYONU YOK" text="Soldaki somut sorulardan birini seç; sonraki dört adım otomatik oluşsun." />}
        </div>
      </section>

      <section className="career-three-col">
        <div className="panel body-card">
          <div className="area-icon"><Dumbbell /></div><span>BODY / 01</span><h3>Hareketi yeniden normal yap</h3><p>İlk altı hafta performans değil, devamlılık. 45–60 dakika yeterli.</p>
          <div className="area-stat"><strong>{state.weeklyTargets.find((target) => target.id === "weekly-sport")?.current ?? 0} / 3</strong><span>bu hafta</span></div>
          <button className="secondary-action full-width" onClick={logWorkout}><Plus /> Antrenman kaydet</button>
        </div>
        <div className="panel creative-card">
          <div className="area-icon"><Sparkles /></div><span>CREATIVE DECK / 02</span><h3>{creative.title}</h3><p>{creative.description}</p>
          <div className="creative-actions"><button onClick={() => setCreativeOffset((value) => value + 1)}><RefreshCcw /> Yeni fikir</button><button onClick={() => setState((current) => ({ ...current, creativeIdeas: current.creativeIdeas.map((idea) => idea.id === creative.id ? { ...idea, saved: !idea.saved } : idea) }))}><Star /> {creative.saved ? "Kaydedildi" : "Fikri kaydet"}</button></div>
          <button className="primary-action full-width" onClick={startCreativeProject}>Projeye dönüştür <ArrowRight /></button>
        </div>
        <div className="panel language-card">
          <div className="area-icon"><Languages /></div><span>ENGLISH / 03</span><h3>İngilizceyi kullan</h3><p>Ders değil; tüketim ve iletişim dili. Şimdi ne yapmak istersin?</p>
          <div className="concrete-actions"><button><Mic2 /><span>10 dk konuş</span></button><button><BookOpen /><span>15 dk izle</span></button><button><Search /><span>İngilizce araştır</span></button></div>
        </div>
      </section>

      <section className="career-two-col lower-career">
        <div className="panel social-card">
          <SectionTitle code="SOCIAL / SOLO" title="Gerçek dünyaya küçük çıkışlar" />
          <p className="section-lead">Büyük sosyal hedefler yerine bir sonraki kolay adım.</p>
          <div className="solo-options">{["Bir müzeye git", "Yeni bir mahallede fotoğraf yürü", "Bir saat kitapçıda kal", "Farklı bir sahil rotası seç", "Yeni bir kafeyi tek başına dene", "Halka açık bir etkinliğe katıl"].map((item, index) => <button key={item}><span>0{index + 1}</span>{item}<ArrowRight /></button>)}</div>
          <button className="secondary-action"><Compass /> Bana sürpriz yap</button>
        </div>
        <div className="panel space-lab-card">
          <SectionTitle code="SPACE ENGINEERING LAB" title="Karar verme; kanıt topla" />
          <p className="section-lead">Üç aylık deney, fiziği mi yoksa görsel ürün tarafını mı sevdiğini anlamak için.</p>
          <div className="space-experiments">{state.spaceExperiments.map((experiment) => <button key={experiment.id} disabled={experiment.status === "locked"} className={`is-${experiment.status}`}><span className="experiment-status">{experiment.status === "active" ? "AKTİF" : experiment.status === "ready" ? "HAZIR" : "SONRA"}</span><strong>{experiment.topic}</strong><small>{experiment.experiment}</small><ArrowRight /></button>)}</div>
        </div>
      </section>
    </div>
  );
}

function WeeklyTargetCard({ target }: { target: WeeklyTarget }) {
  const ratio = Math.min(target.current / target.target, 1);
  const segments = 5;
  return <div className={classNames("weekly-target-card", `tone-${target.tone}`)}><span>{target.shortLabel}</span><div className="weekly-target-value"><strong>{target.current}</strong><i>/ {target.target}</i></div><div className="segment-meter">{Array.from({ length: segments }, (_, index) => <i className={index < Math.round(ratio * segments) ? "is-filled" : ""} key={index} />)}</div><small>{target.unit}</small></div>;
}

function WorkPage({ state, setState, openCapture }: { state: PersonalOSState; setState: React.Dispatch<React.SetStateAction<PersonalOSState>>; openCapture: () => void }) {
  const workspaces: WorkNote["workspace"][] = ["TURASİSTAN", "WEB SİTESİ", "TASARIM", "GENEL"];
  const [workspace, setWorkspace] = useState<WorkNote["workspace"]>("WEB SİTESİ");
  const visible = state.workNotes.filter((note) => note.workspace === workspace);
  const toggleChecklist = (noteId: string, subId: string) => setState((current) => ({ ...current, workNotes: current.workNotes.map((note) => note.id === noteId ? { ...note, checklist: note.checklist.map((item) => item.id === subId ? { ...item, completed: !item.completed } : item) } : note) }));

  return (
    <div className="work-layout">
      <div className="work-banner"><div><span>PROFESSIONAL WORKSPACE</span><h2>KIBLETEYN</h2><p>Kişisel planlamadan ayrılmış profesyonel operasyon alanı.</p></div><div className="work-banner-code"><span>ORG / 01</span><strong>{state.workNotes.filter((note) => note.status !== "Tamamlandı").length} AÇIK KAYIT</strong></div></div>
      <div className="workspace-tabs">{workspaces.map((item) => <button key={item} className={workspace === item ? "is-active" : ""} onClick={() => setWorkspace(item)}><Folder />{item}<span>{state.workNotes.filter((note) => note.workspace === item).length}</span></button>)}</div>
      <div className="work-notes-grid">{visible.map((note) => {
        const done = note.checklist.filter((item) => item.completed).length;
        return <article className="work-note-card" key={note.id}><div className="work-note-top"><span className={`priority-bar is-${note.priority}`} /><div><span>{note.workspace}</span><h3>{note.title}</h3></div><button className="icon-button subtle"><MoreHorizontal /></button></div><p>{note.description}</p><div className="work-note-meta"><span className={`work-status is-${note.status === "Tamamlandı" ? "done" : note.status === "Devam Ediyor" ? "progress" : "waiting"}`}>{note.status}</span><span><CalendarDays />{formatDate(note.date)}</span><span>{done}/{note.checklist.length} tamamlandı</span></div><div className="work-checklist">{note.checklist.map((item) => <button key={item.id} className={item.completed ? "is-complete" : ""} onClick={() => toggleChecklist(note.id, item.id)}>{item.completed ? <CheckCircle2 /> : <Circle />}<span>{item.title}</span></button>)}</div></article>;
      })}<button className="work-add-card" onClick={openCapture}><Plus /><strong>Yeni iş notu</strong><span>{workspace} alanına ekle</span></button></div>
    </div>
  );
}

function NotesPage({ state, setState, openCapture }: { state: PersonalOSState; setState: React.Dispatch<React.SetStateAction<PersonalOSState>>; openCapture: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(state.notes[0]?.id ?? "");
  const folders = Array.from(new Set(state.notes.map((note) => note.folder.split(" / ")[0])));
  const [folder, setFolder] = useState<string>("TÜMÜ");
  const visible = state.notes.filter((note) => !note.archived && (folder === "TÜMÜ" || note.folder.startsWith(folder)) && `${note.title} ${note.content} ${note.tags.join(" ")}`.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR")));
  const selected = state.notes.find((note) => note.id === selectedId) ?? visible[0];
  const updateSelected = (updates: Partial<Note>) => selected && setState((current) => ({ ...current, notes: current.notes.map((note) => note.id === selected.id ? { ...note, ...updates, updatedAt: todayIso() } : note) }));

  return (
    <div className="notes-layout">
      <aside className="folder-tree">
        <div className="notes-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Notlarda ara" /></div>
        <button className={folder === "TÜMÜ" ? "is-active" : ""} onClick={() => setFolder("TÜMÜ")}><Folder />Tüm Notlar<span>{state.notes.filter((note) => !note.archived).length}</span></button>
        <button className={folder === "FAVORİLER" ? "is-active" : ""} onClick={() => setFolder("FAVORİLER")}><Star />Favoriler<span>{state.notes.filter((note) => note.favorite).length}</span></button>
        <span className="tree-label">KLASÖRLER</span>
        {folders.map((name) => <button key={name} className={folder === name ? "is-active" : ""} onClick={() => setFolder(name)}><ChevronRight />{name}<span>{state.notes.filter((note) => note.folder.startsWith(name)).length}</span></button>)}
        <button className="inline-add folder-add" onClick={openCapture}><Plus />Yeni not</button>
      </aside>
      <section className="note-list-pane">
        <div className="note-list-header"><span>{folder}</span><strong>{visible.length} not</strong></div>
        <div className="note-list">{visible.map((note) => <button key={note.id} className={selected?.id === note.id ? "is-active" : ""} onClick={() => setSelectedId(note.id)}><div><strong>{note.title}</strong>{note.favorite && <Star className="favorite-star" />}</div><p>{note.content.replace(/[#\[\]-]/g, "").slice(0, 92)}</p><span>{note.folder}</span><small>{formatDate(note.updatedAt)}</small></button>)}</div>
      </section>
      <section className="note-editor">
        {selected ? <>
          <div className="editor-toolbar"><span><Folder />{selected.folder}</span><div><button className={selected.favorite ? "is-active" : ""} onClick={() => updateSelected({ favorite: !selected.favorite })}><Star /></button><button onClick={() => updateSelected({ archived: true })}><Archive /></button><button><MoreHorizontal /></button></div></div>
          <input className="note-title-input" value={selected.title} onChange={(event) => updateSelected({ title: event.target.value })} aria-label="Not başlığı" />
          <div className="note-tags">{selected.tags.map((tag) => <span key={tag}>#{tag}</span>)}<button><Plus /> etiket</button></div>
          <textarea className="note-content-editor" value={selected.content} onChange={(event) => updateSelected({ content: event.target.value })} aria-label="Not içeriği" />
          <div className="editor-footer"><span>Markdown benzeri düzenleme</span><span>Son kayıt: {formatDate(selected.updatedAt, { day: "numeric", month: "long", year: "numeric" })}</span></div>
        </> : <EmptyState icon={FileText} title="BİR NOT SEÇ" text="Soldaki arşivden bir not seç veya yeni bir not oluştur." action="Yeni not" onAction={openCapture} />}
      </section>
    </div>
  );
}

function ArchivePage({ state }: { state: PersonalOSState }) {
  const completeProjects = state.projects.filter((project) => project.status === "done");
  const completeTasks = state.tasks.filter((task) => task.completed);
  const archivedNotes = state.notes.filter((note) => note.archived);
  return <div className="archive-grid"><section className="panel"><SectionTitle code="PROJECTS" title="Tamamlanan projeler" />{completeProjects.length ? completeProjects.map((project) => <div className="archive-row" key={project.id}><CheckCircle2 /><div><strong>{project.title}</strong><span>{project.category}</span></div><b>{project.progress}%</b></div>) : <EmptyState icon={Orbit} title="HENÜZ TAMAMLANAN PROJE YOK" text="Bitmiş misyonlar burada sakin bir geçmiş oluşturacak." />}</section><section className="panel"><SectionTitle code="TASKS" title="Tamamlanan görevler" />{completeTasks.map((task) => <div className="archive-row" key={task.id}><CheckCircle2 /><div><strong>{task.title}</strong><span>{task.date ? formatDate(task.date) : "Tarihsiz"}</span></div></div>)}</section><section className="panel"><SectionTitle code="NOTES" title="Arşiv notları" />{archivedNotes.length ? archivedNotes.map((note) => <div className="archive-row" key={note.id}><FileText /><div><strong>{note.title}</strong><span>{note.folder}</span></div></div>) : <EmptyState icon={Archive} title="ARŞİV BOŞ" text="Aktif notlar gözden kaybolmadan burada saklanır." />}</section></div>;
}

function SettingsPage({ syncState, state }: { syncState: string; state: PersonalOSState }) {
  return <div className="settings-grid"><section className="panel settings-section"><SectionTitle code="DATA" title="Kayıt ve senkronizasyon" /><div className="setting-row"><div><strong>Kalıcı kayıt</strong><span>Projeler, görevler, notlar ve haftalık geçmiş platform veritabanında tutulur.</span></div><span className={`setting-value is-${syncState}`}>{syncState === "saved" ? "AKTİF" : syncState === "offline" ? "ÖNİZLEME" : "İŞLENİYOR"}</span></div><div className="setting-row"><div><strong>Toplam kayıt</strong><span>{state.projects.length} proje · {state.tasks.length} görev · {state.notes.length} not</span></div><span className="setting-value">V1</span></div></section><section className="panel settings-section"><SectionTitle code="PREFERENCES" title="Arayüz tercihleri" /><div className="setting-row"><div><strong>Hareket azaltma</strong><span>Sistem cihazındaki erişilebilirlik tercihini otomatik izler.</span></div><span className="setting-value">OTOMATİK</span></div><div className="setting-row"><div><strong>Hafta başlangıcı</strong><span>Takvim ve haftalık sistem pazartesi günü başlar.</span></div><span className="setting-value">PAZARTESİ</span></div></section><section className="panel settings-section future-section"><SectionTitle code="FUTURE INTERFACE" title="AI için hazır, AI'a bağımlı değil" /><p>Sesli yakalama, doğal dil ayrıştırma, semantik arama ve haftalık plan asistanı için veri katmanı genişletilebilir durumda. Mevcut ürün tüm temel akışları yerel soru ve öneri bankalarıyla çalıştırır.</p></section></div>;
}

function ProjectDrawer({ project, onClose, onToggleSubtask, setState }: { project: Project; onClose: () => void; onToggleSubtask: (id: string) => void; setState: React.Dispatch<React.SetStateAction<PersonalOSState>> }) {
  const [newSubtask, setNewSubtask] = useState("");
  const addSubtask = (event: FormEvent) => { event.preventDefault(); if (!newSubtask.trim()) return; setState((current) => ({ ...current, projects: current.projects.map((item) => item.id === project.id ? { ...item, subtasks: [...item.subtasks, { id: uid("sub"), title: newSubtask.trim(), completed: false }] } : item) })); setNewSubtask(""); };
  const updateStatus = (status: ProjectStatus) => setState((current) => ({ ...current, projects: current.projects.map((item) => item.id === project.id ? { ...item, status } : item) }));
  return <div className="overlay drawer-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="project-drawer" role="dialog" aria-modal="true" aria-label={`${project.title} proje ayrıntıları`}><div className="drawer-top"><span>{project.category}</span><button className="icon-button" onClick={onClose}><X /></button></div><h2>{project.title}</h2><p className="drawer-description">{project.description}</p><div className="drawer-facts"><div><span>DURUM</span><select value={project.status} onChange={(event) => updateStatus(event.target.value as ProjectStatus)}>{(Object.keys(statusLabels) as ProjectStatus[]).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></div><div><span>ÖNCELİK</span><strong>{priorityLabels[project.priority]}</strong></div><div><span>BAŞLANGIÇ</span><strong>{formatDate(project.startDate)}</strong></div><div><span>SON TARİH</span><strong>{project.dueDate ? formatDate(project.dueDate) : "Açık"}</strong></div></div><div className="drawer-progress"><div><span>GENEL İLERLEME</span><strong>{project.progress}%</strong></div><Meter value={project.progress} /></div><section className="drawer-section"><span className="drawer-label">SONRAKİ NET ADIM</span><div className="next-action-callout"><Target /><strong>{project.nextAction}</strong></div></section><section className="drawer-section"><div className="drawer-section-title"><span>ALT GÖREVLER</span><strong>{project.subtasks.filter((item) => item.completed).length}/{project.subtasks.length}</strong></div><div className="drawer-subtasks">{project.subtasks.map((subtask) => <button key={subtask.id} className={subtask.completed ? "is-complete" : ""} onClick={() => onToggleSubtask(subtask.id)}>{subtask.completed ? <CheckCircle2 /> : <Circle />}<span>{subtask.title}</span></button>)}</div><form className="subtask-form" onSubmit={addSubtask}><input value={newSubtask} onChange={(event) => setNewSubtask(event.target.value)} placeholder="Alt görev ekle…" /><button className="icon-button primary-icon"><Plus /></button></form></section>{project.notes && <section className="drawer-section"><span className="drawer-label">NOTLAR</span><p className="drawer-note">{project.notes}</p></section>}<div className="drawer-tags">{project.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div></aside></div>;
}

function CaptureDialog({ type, setType, state, setState, onClose }: { type: CaptureType; setType: (type: CaptureType) => void; state: PersonalOSState; setState: React.Dispatch<React.SetStateAction<PersonalOSState>>; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [date, setDate] = useState(todayIso());
  const [priority, setPriority] = useState<Priority>("medium");
  const [projectId, setProjectId] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault(); if (!title.trim()) return;
    if (type === "task") { const task: Task = { id: uid("task"), title: title.trim(), category: "todo", completed: false, priority, date, notes: detail, projectId: projectId || undefined, subtasks: [] }; setState((current) => ({ ...current, tasks: [task, ...current.tasks], calendarItems: [...current.calendarItems, { id: uid("cal"), title: task.title, date, type: projectId ? "project" : "task" }] })); }
    if (type === "project") { const project: Project = { id: uid("project"), title: title.trim().toUpperCase(), category: "YENİ MİSYON", description: detail || "Yeni proje", status: "backlog", priority, startDate: todayIso(), dueDate: date, progress: 0, tags: [], nextAction: "İlk somut adımı tanımla", subtasks: [] }; setState((current) => ({ ...current, projects: [project, ...current.projects] })); }
    if (type === "note" || type === "research") { const note: Note = { id: uid("note"), title: title.trim(), folder: type === "research" ? "ARAŞTIRMA / Gelen Kutusu" : "GELEN KUTUSU", content: detail, tags: type === "research" ? ["araştırma"] : [], favorite: false, archived: false, updatedAt: todayIso() }; setState((current) => ({ ...current, notes: [note, ...current.notes] })); }
    if (type === "work") { const note: WorkNote = { id: uid("work"), title: title.trim(), workspace: "GENEL", description: detail, status: "Bekliyor", priority, date, checklist: [] }; setState((current) => ({ ...current, workNotes: [note, ...current.workNotes] })); }
    onClose();
  };
  return <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="capture-dialog" onSubmit={submit} role="dialog" aria-modal="true"><div className="dialog-header"><div><span>HIZLI KAYIT</span><h2>Yeni bir şey ekle</h2></div><button type="button" className="icon-button" onClick={onClose}><X /></button></div><div className="dialog-type-tabs">{(["task", "note", "project", "work", "research"] as CaptureType[]).map((item) => <button type="button" key={item} className={type === item ? "is-active" : ""} onClick={() => setType(item)}>{item === "task" ? "Görev" : item === "note" ? "Not" : item === "project" ? "Proje" : item === "work" ? "İş notu" : "Araştırma"}</button>)}</div><label>Başlık<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder={type === "task" ? "Ne yapılacak?" : type === "project" ? "Misyonun adı" : "Kısa ve net başlık"} /></label><label>Açıklama<textarea value={detail} onChange={(event) => setDetail(event.target.value)} rows={4} placeholder="Bağlam, not veya ilk düşünce…" /></label>{type === "task" && <label>Proje ilişkisi<select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">Kişisel / proje yok</option>{state.projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>}{(type === "task" || type === "project" || type === "work") && <div className="dialog-two-col"><label>Tarih<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label>Öncelik<select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option value="low">Düşük</option><option value="medium">Normal</option><option value="high">Yüksek</option></select></label></div>}<div className="dialog-actions"><button type="button" className="secondary-action" onClick={onClose}>Vazgeç</button><button className="primary-action" disabled={!title.trim()}><Plus /> Kaydı oluştur</button></div></form></div>;
}

function CommandPalette({ state, onClose, go, openCapture, openProject }: { state: PersonalOSState; onClose: () => void; go: (section: Section) => void; openCapture: (type: CaptureType) => void; openProject: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const normalized = query.toLocaleLowerCase("tr-TR");
  const commands: { label: string; hint: string; icon: LucideIcon; action: () => void }[] = [
    { label: "Yeni görev", hint: "Görev oluştur", icon: ClipboardCheck, action: () => openCapture("task") },
    { label: "Yeni not", hint: "Not oluştur", icon: FileText, action: () => openCapture("note") },
    { label: "Yeni proje", hint: "Misyon başlat", icon: Orbit, action: () => openCapture("project") },
    { label: "Takvimi aç", hint: "Ay görünümü", icon: CalendarDays, action: () => { onClose(); go("calendar"); } },
    { label: "Rebuild'i aç", hint: "Haftalık sistem", icon: Rocket, action: () => { onClose(); go("career"); } },
    { label: "İş notu ekle", hint: "Kıbleteyn", icon: BriefcaseBusiness, action: () => openCapture("work") },
  ];
  const searchResults = normalized ? [
    ...state.projects.filter((item) => `${item.title} ${item.category}`.toLocaleLowerCase("tr-TR").includes(normalized)).map((item) => ({ id: item.id, type: "PROJE", title: item.title, detail: item.nextAction, action: () => openProject(item.id) })),
    ...state.tasks.filter((item) => item.title.toLocaleLowerCase("tr-TR").includes(normalized)).map((item) => ({ id: item.id, type: "GÖREV", title: item.title, detail: item.date ? formatDate(item.date) : "Tarihsiz", action: () => { onClose(); go("tasks"); } })),
    ...state.notes.filter((item) => `${item.title} ${item.content}`.toLocaleLowerCase("tr-TR").includes(normalized)).map((item) => ({ id: item.id, type: "NOT", title: item.title, detail: item.folder, action: () => { onClose(); go("notes"); } })),
    ...state.workNotes.filter((item) => `${item.title} ${item.description}`.toLocaleLowerCase("tr-TR").includes(normalized)).map((item) => ({ id: item.id, type: "İŞ", title: item.title, detail: item.workspace, action: () => { onClose(); go("work"); } })),
  ].slice(0, 10) : [];
  return <div className="overlay command-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="command-dialog" role="dialog" aria-modal="true" aria-label="Komut paleti"><div className="command-search"><Search /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ara veya bir komut yaz…" /><kbd>ESC</kbd></div><div className="command-results">{normalized ? <><span className="command-group-label">ARAMA SONUÇLARI</span>{searchResults.map((result) => <button key={`${result.type}-${result.id}`} onClick={result.action}><span className="result-type">{result.type}</span><span><strong>{result.title}</strong><small>{result.detail}</small></span><ArrowRight /></button>)}{!searchResults.length && <EmptyState icon={Search} title="SONUÇ BULUNAMADI" text="Başka bir kelime veya daha kısa bir ifade dene." />}</> : <><span className="command-group-label">HIZLI KOMUTLAR</span>{commands.map((command) => { const Icon = command.icon; return <button key={command.label} onClick={command.action}><span className="command-icon"><Icon /></span><span><strong>{command.label}</strong><small>{command.hint}</small></span><ArrowRight /></button>; })}</>}</div><div className="command-footer"><span><kbd>↑</kbd><kbd>↓</kbd> gezin</span><span><kbd>↵</kbd> aç</span><span>Personal OS araması</span></div></div></div>;
}

function MobileNav({ active, go }: { active: Section; go: (section: Section) => void }) {
  const items = navPrimary.slice(0, 5);
  return <nav className="mobile-nav" aria-label="Mobil navigasyon">{items.map((item) => { const Icon = item.icon; return <button key={item.id} className={active === item.id ? "is-active" : ""} onClick={() => go(item.id)}><Icon /><span>{item.id === "home" ? "Ana" : item.label}</span></button>; })}</nav>;
}

function EmptyState({ icon: Icon, title, text, action, onAction }: { icon: LucideIcon; title: string; text: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><span className="empty-radar"><Icon /></span><strong>{title}</strong><p>{text}</p>{action && <button className="text-action" onClick={onAction}>{action}<ArrowRight /></button>}</div>;
}

