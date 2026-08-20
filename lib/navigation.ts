export type Section = "home" | "projects" | "tasks" | "calendar" | "career" | "work" | "notes" | "archive" | "settings";
export type CaptureType = "task" | "note" | "project" | "work" | "research";

export const sectionPaths: Record<Section, string> = {
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

export const sectionMeta: Record<Section, { title: string; short: string }> = {
  home: { title: "Bugün", short: "Ana" },
  projects: { title: "Projeler", short: "Projeler" },
  tasks: { title: "Görevler", short: "Görevler" },
  calendar: { title: "Takvim", short: "Takvim" },
  career: { title: "Rebuild", short: "Rebuild" },
  work: { title: "Kıbleteyn", short: "İş" },
  notes: { title: "Notlar", short: "Notlar" },
  archive: { title: "Arşiv", short: "Arşiv" },
  settings: { title: "Ayarlar", short: "Ayarlar" },
};
