export type ProjectStatus = "backlog" | "todo" | "progress" | "review" | "done";
export type Priority = "low" | "medium" | "high";
export type TaskCategory = "todo" | "purchase" | "place";

export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Project = {
  id: string;
  title: string;
  category: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  startDate: string;
  dueDate?: string;
  progress: number;
  tags: string[];
  nextAction: string;
  subtasks: Subtask[];
  notes?: string;
  links?: string[];
};

export type Task = {
  id: string;
  title: string;
  category: TaskCategory;
  completed: boolean;
  priority: Priority;
  date?: string;
  time?: string;
  notes?: string;
  projectId?: string;
  recurrence?: string;
  estimate?: string;
  link?: string;
  city?: string;
  placeType?: string;
  imageUrl?: string;
  subtasks: Subtask[];
};

export type CalendarItem = {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: "task" | "event" | "project" | "work" | "personal";
};

export type Note = {
  id: string;
  title: string;
  folder: string;
  content: string;
  tags: string[];
  favorite: boolean;
  archived: boolean;
  updatedAt: string;
};

export type WorkNote = {
  id: string;
  title: string;
  workspace: "TURASİSTAN" | "WEB SİTESİ" | "TASARIM" | "GENEL";
  description: string;
  status: "Bekliyor" | "Devam Ediyor" | "Tamamlandı";
  priority: Priority;
  date: string;
  checklist: Subtask[];
  links?: string[];
};

export type CuriosityQuestion = {
  id: string;
  category: string;
  question: string;
};

export type CuriosityMission = {
  id: string;
  questionId: string;
  question: string;
  startedAt: string;
  stage: "explore" | "understand" | "create" | "explain" | "complete";
  creationType?: string;
  reflection?: string;
};

export type WeeklyTarget = {
  id: string;
  label: string;
  shortLabel: string;
  current: number;
  target: number;
  unit: string;
  tone: "green" | "amber" | "cyan" | "neutral";
};

export type CreativeIdea = {
  id: string;
  title: string;
  description: string;
  saved: boolean;
};

export type SpaceExperiment = {
  id: string;
  topic: string;
  learn: string;
  experiment: string;
  status: "locked" | "ready" | "active" | "complete";
  reflection?: string;
};

export type ActivityLog = {
  id: string;
  area: "body" | "english" | "diction" | "social" | "creative" | "career";
  title: string;
  date: string;
  duration?: number;
  note?: string;
};

export type WeeklyHistory = {
  id: string;
  label: string;
  score: number;
  summary: string;
};

export type PersonalOSState = {
  version: 1;
  projects: Project[];
  tasks: Task[];
  calendarItems: CalendarItem[];
  notes: Note[];
  workNotes: WorkNote[];
  curiosityQuestions: CuriosityQuestion[];
  curiosityMission?: CuriosityMission;
  weeklyTargets: WeeklyTarget[];
  weeklyHistory: WeeklyHistory[];
  creativeIdeas: CreativeIdea[];
  spaceExperiments: SpaceExperiment[];
  activityLogs: ActivityLog[];
  recentQuestionIds: string[];
};

