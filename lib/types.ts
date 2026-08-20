export type ProjectStatus = "backlog" | "todo" | "progress" | "review" | "done";
export type Priority = "low" | "medium" | "high";
export type TaskCategory = "todo" | "purchase" | "place";
export type WeekStart = "monday" | "sunday";

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
  activity?: ProjectActivity[];
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectActivity = {
  id: string;
  type: "created" | "status" | "subtask" | "note" | "updated";
  label: string;
  at: string;
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
  createdAt?: string;
  updatedAt?: string;
  deferredUntil?: string;
  completedAt?: string;
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
  score?: number;
  tempo?: number;
  clarity?: number;
  fillerWords?: number;
  confidence?: number;
  recording?: VoiceRecording;
};

export type VoiceRecording = {
  key: string;
  mimeType: string;
  size: number;
  durationSeconds: number;
};

export type WeeklyHistory = {
  id: string;
  label: string;
  score: number;
  summary: string;
};

export type WeeklyPlan = {
  id: string;
  weekStart: string;
  targets: WeeklyTarget[];
  focus?: string;
};

export type WeeklySnapshot = {
  id: string;
  weekStart: string;
  score: number;
  targets: WeeklyTarget[];
  reflection?: string;
};

export type PersonalOSPreferences = {
  reduceMotion: boolean;
  weekStart: WeekStart;
};

export type PersonalOSState = {
  version: 2;
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
  weeklyPlans: WeeklyPlan[];
  weeklySnapshots: WeeklySnapshot[];
  preferences: PersonalOSPreferences;
};

