export type SkillLevel = "Easy" | "Medium" | "Hard";
export type TaskPriority = "Low" | "Medium" | "High";

export type MentorshipTaskType = "daily" | "stage" | "practice" | "assessment" | "interview";

export type MentorshipTask = {
  id: string;
  title: string;
  type: MentorshipTaskType;
  level: SkillLevel;
  priority?: TaskPriority;
  stageId?: string;
  stageNumber?: number;
  dueDateKey: string;
  status: "pending" | "done";
  createdAt: string;
  completedAt?: string;
  feedback?: string;
  rating?: number;
};

export const MENTORSHIP_TASKS_KEY = "study.mentorship.tasks";

function normalizePriority(input: unknown): TaskPriority {
  const txt = typeof input === "string" ? input.trim().toLowerCase() : "";
  if (txt === "low") return "Low";
  if (txt === "high") return "High";
  return "Medium";
}

export function normalizeLevel(input: unknown): SkillLevel {
  const txt = typeof input === "string" ? input.trim().toLowerCase() : "";
  if (txt === "easy") return "Easy";
  if (txt === "hard") return "Hard";
  return "Medium";
}

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number) {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
}

function id() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function getAssessmentInterval(level: SkillLevel) {
  if (level === "Easy") return 8;
  if (level === "Hard") return 6;
  return 7;
}

export function getCadenceDays(level: SkillLevel) {
  if (level === "Easy") return 2;
  if (level === "Hard") return 1;
  return 1;
}

export function buildMentorshipTasks(
  stages: Array<{ id: string; title: string }>,
  level: SkillLevel,
  startDate = new Date()
): MentorshipTask[] {
  const tasks: MentorshipTask[] = [];
  const interval = getAssessmentInterval(level);
  const cadenceDays = getCadenceDays(level);

  stages.forEach((stage, idx) => {
    const stageNumber = idx + 1;
    const baseDate = addDays(startDate, idx * cadenceDays);
    const dueDateKey = toDateKey(baseDate);

    tasks.push({
      id: id(),
      title: `Task ${stageNumber}: ${stage.title}`,
      type: "stage",
      level,
      stageId: stage.id,
      stageNumber,
      dueDateKey,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    tasks.push({
      id: id(),
      title: `Practice ${stageNumber}: Structured Q&A`,
      type: "practice",
      level,
      stageId: stage.id,
      stageNumber,
      dueDateKey,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    if (stageNumber % interval === 0) {
      tasks.push({
        id: id(),
        title: `Assessment ${Math.floor(stageNumber / interval)}: Retention Checkpoint`,
        type: "assessment",
        level,
        stageId: stage.id,
        stageNumber,
        dueDateKey,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    }
  });

  if (stages.length > 0) {
    const finalDate = addDays(startDate, stages.length * cadenceDays);
    tasks.push({
      id: id(),
      title: "Mock Interview: Final Mentorship Evaluation",
      type: "interview",
      level,
      stageNumber: stages.length,
      dueDateKey: toDateKey(finalDate),
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  }

  return tasks;
}

export function readMentorshipTasks(): MentorshipTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MENTORSHIP_TASKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is MentorshipTask =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.type === "string" &&
        typeof item.dueDateKey === "string" &&
        typeof item.status === "string"
    );
  } catch {
    return [];
  }
}

export function writeMentorshipTasks(tasks: MentorshipTask[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MENTORSHIP_TASKS_KEY, JSON.stringify(tasks.slice(0, 1000)));
  } catch {
    // ignore storage failures
  }
}

export function completeStageMentorshipTasks(
  stageId: string,
  payload?: {
    includeAssessment?: boolean;
    includePractice?: boolean;
    feedback?: string;
    rating?: number;
  }
) {
  if (typeof window === "undefined") return;
  const tasks = readMentorshipTasks();
  if (tasks.length === 0) return;

  const includeAssessment = payload?.includeAssessment === true;
  const includePractice = payload?.includePractice !== false;

  const shouldMark = (task: MentorshipTask) => {
    if (task.stageId !== stageId || task.status === "done") return false;
    if (task.type === "stage") return true;
    if (task.type === "practice") return includePractice;
    if (task.type === "assessment") return includeAssessment;
    return false;
  };

  const next = tasks.map((task) => {
    if (!shouldMark(task)) return task;
    return {
      ...task,
      status: "done" as const,
      completedAt: new Date().toISOString(),
      feedback: payload?.feedback?.trim() || task.feedback,
      rating: typeof payload?.rating === "number" ? payload.rating : task.rating,
    };
  });

  writeMentorshipTasks(next);
}

export function completeInterviewMentorshipTask(payload?: { feedback?: string; rating?: number }) {
  if (typeof window === "undefined") return;
  const tasks = readMentorshipTasks();
  const idx = tasks.findIndex((t) => t.type === "interview" && t.status === "pending");
  if (idx < 0) return;
  tasks[idx] = {
    ...tasks[idx],
    status: "done",
    completedAt: new Date().toISOString(),
    feedback: payload?.feedback?.trim() || tasks[idx].feedback,
    rating: typeof payload?.rating === "number" ? payload.rating : tasks[idx].rating,
  };
  writeMentorshipTasks(tasks);
}

export function getStageBand(stageNumber: number) {
  if (stageNumber <= 10) return "Stage 1-10";
  if (stageNumber <= 20) return "Stage 11-20";
  return "Stage 21-30";
}

export function upsertTodayMentorshipTask(input: {
  title: string;
  level: SkillLevel;
  priority?: TaskPriority | string;
  topic?: string;
}) {
  if (typeof window === "undefined") return;
  const title = (input.title || "").trim();
  if (!title) return;

  const tasks = readMentorshipTasks();
  const dueDateKey = toDateKey(new Date());
  const priority = normalizePriority(input.priority);
  const topic = (input.topic || "").trim();
  const feedback = topic
    ? `Today's focus: ${topic}. Priority: ${priority}.`
    : `Priority: ${priority}.`;

  const idx = tasks.findIndex(
    (task) =>
      task.type === "daily" &&
      task.dueDateKey === dueDateKey &&
      task.status === "pending" &&
      task.title.toLowerCase() === title.toLowerCase()
  );

  const nextTask: MentorshipTask = {
    id: idx >= 0 ? tasks[idx].id : id(),
    title,
    type: "daily",
    level: input.level,
    priority,
    dueDateKey,
    status: idx >= 0 ? tasks[idx].status : "pending",
    createdAt: idx >= 0 ? tasks[idx].createdAt : new Date().toISOString(),
    completedAt: idx >= 0 ? tasks[idx].completedAt : undefined,
    feedback,
    rating: idx >= 0 ? tasks[idx].rating : undefined,
  };

  if (idx >= 0) {
    tasks[idx] = nextTask;
  } else {
    tasks.unshift(nextTask);
  }

  writeMentorshipTasks(tasks);
}
