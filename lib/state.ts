import { createSeedState } from "./seed.ts";
import type { PersonalOSState, Project, WeeklyTarget } from "./types.ts";

type LegacyState = Omit<Partial<PersonalOSState>, "version"> & { version?: number };

export function projectProgress(project: Pick<Project, "subtasks" | "progress">) {
  if (!project.subtasks.length) return project.progress ?? 0;
  return Math.round((project.subtasks.filter((item) => item.completed).length / project.subtasks.length) * 100);
}

function mondayOfCurrentWeek() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

export function migrateState(value: unknown): PersonalOSState {
  const seed = createSeedState();
  if (!value || typeof value !== "object") return seed;
  const legacy = value as LegacyState;
  const targets = Array.isArray(legacy.weeklyTargets) ? legacy.weeklyTargets as WeeklyTarget[] : seed.weeklyTargets;
  const projects = Array.isArray(legacy.projects)
    ? legacy.projects.map((project) => ({
        ...project,
        progress: projectProgress(project),
        activity: project.activity ?? [],
        createdAt: project.createdAt ?? project.startDate,
        updatedAt: project.updatedAt ?? project.startDate,
      }))
    : seed.projects;
  const tasks = Array.isArray(legacy.tasks)
    ? legacy.tasks.map((task) => ({
        ...task,
        createdAt: task.createdAt ?? task.date ?? new Date().toISOString().slice(0, 10),
        updatedAt: task.updatedAt ?? task.date ?? new Date().toISOString().slice(0, 10),
        completedAt: task.completed ? task.completedAt ?? task.date : undefined,
      }))
    : seed.tasks;

  const migrated: PersonalOSState = {
    ...seed,
    ...legacy,
    version: 2,
    projects,
    tasks,
    calendarItems: Array.isArray(legacy.calendarItems) ? legacy.calendarItems : seed.calendarItems,
    notes: Array.isArray(legacy.notes) ? legacy.notes : seed.notes,
    workNotes: Array.isArray(legacy.workNotes) ? legacy.workNotes : seed.workNotes,
    curiosityQuestions: Array.isArray(legacy.curiosityQuestions) ? legacy.curiosityQuestions : seed.curiosityQuestions,
    weeklyTargets: targets,
    weeklyHistory: Array.isArray(legacy.weeklyHistory) ? legacy.weeklyHistory : seed.weeklyHistory,
    creativeIdeas: Array.isArray(legacy.creativeIdeas) ? legacy.creativeIdeas : seed.creativeIdeas,
    spaceExperiments: Array.isArray(legacy.spaceExperiments) ? legacy.spaceExperiments : seed.spaceExperiments,
    activityLogs: Array.isArray(legacy.activityLogs) ? legacy.activityLogs : seed.activityLogs,
    recentQuestionIds: Array.isArray(legacy.recentQuestionIds) ? legacy.recentQuestionIds : seed.recentQuestionIds,
    weeklyPlans: Array.isArray(legacy.weeklyPlans) && legacy.weeklyPlans.length
      ? legacy.weeklyPlans
      : [{ id: `week-${mondayOfCurrentWeek()}`, weekStart: mondayOfCurrentWeek(), targets, focus: "Ritmi koru; tek bir sonraki adıma dön." }],
    weeklySnapshots: Array.isArray(legacy.weeklySnapshots) ? legacy.weeklySnapshots : seed.weeklySnapshots,
    preferences: { ...seed.preferences, ...(legacy.preferences ?? {}) },
  };

  const currentWeek = mondayOfCurrentWeek();
  if (!migrated.weeklyPlans.some((plan) => plan.weekStart === currentWeek)) {
    const previous = [...migrated.weeklyPlans].sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0];
    const completed = previous?.targets.reduce((sum, target) => sum + Math.min(target.current / Math.max(target.target, 1), 1), 0) ?? 0;
    const score = previous?.targets.length ? Math.round((completed / previous.targets.length) * 100) : 0;
    const snapshots = previous && !migrated.weeklySnapshots.some((snapshot) => snapshot.weekStart === previous.weekStart)
      ? [{ id: `snapshot-${previous.weekStart}`, weekStart: previous.weekStart, score, targets: previous.targets, reflection: "Hafta sakince kapatıldı; kayıtlar geçmişe taşındı." }, ...migrated.weeklySnapshots]
      : migrated.weeklySnapshots;
    const nextTargets = migrated.weeklyTargets.map((target) => ({ ...target, current: 0 }));
    return {
      ...migrated,
      weeklyTargets: nextTargets,
      weeklyPlans: [{ id: `week-${currentWeek}`, weekStart: currentWeek, targets: nextTargets, focus: "Ritmi koru; tek bir sonraki adıma dön." }, ...migrated.weeklyPlans],
      weeklySnapshots: snapshots,
    };
  }

  return migrated;
}
