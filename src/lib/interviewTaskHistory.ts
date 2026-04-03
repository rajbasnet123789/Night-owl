export const INTERVIEW_TASK_HISTORY_KEY = "study.interview.tasks";

export type InterviewTaskHistoryItem = {
  id: string;
  taskNumber: number;
  title: string;
  sessionId?: string;
  topic: string;
  dateKey: string;
  createdAt: string;
  progressPercent: number;
  questionsAnswered: number;
  questionsTotal: number;
  averageWords: number;
  conciseRatio: number;
  efficiency: number;
  rating: number;
  feedback: string;
  strengths: string[];
  gaps: string[];
};

type SummaryPayload = {
  topic?: string;
  coveredQuestions?: number;
  targetQuestions?: number;
  averageWordsPerAnswer?: number;
  conciseAnswerRatio?: number;
  efficiencyScore?: number;
  finalFeedback?: string;
  strengths?: string[];
  gaps?: string[];
};

type TaskProgressInput = {
  sessionId?: string | null;
  topic?: string | null;
  summary: SummaryPayload;
  fallbackPerformance?: {
    answered?: number;
    averageWords?: number;
    conciseRatio?: number;
    efficiency?: number;
    progressPercent?: number;
  };
  fallbackQuestionProgress?: {
    asked?: number;
    total?: number;
  };
};

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function nowIso() {
  return new Date().toISOString();
}

function toLocalDateKey(dateInput: Date | string) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function makeId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function readInterviewTaskHistory(): InterviewTaskHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(INTERVIEW_TASK_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is InterviewTaskHistoryItem => {
        return (
          typeof item === "object" &&
          item !== null &&
          typeof (item as InterviewTaskHistoryItem).id === "string" &&
          typeof (item as InterviewTaskHistoryItem).taskNumber === "number" &&
          typeof (item as InterviewTaskHistoryItem).createdAt === "string" &&
          typeof (item as InterviewTaskHistoryItem).dateKey === "string"
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export function writeInterviewTaskHistory(tasks: InterviewTaskHistoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(INTERVIEW_TASK_HISTORY_KEY, JSON.stringify(tasks.slice(0, 600)));
  } catch {
    // ignore storage failures
  }
}

export function upsertInterviewTaskHistory(input: TaskProgressInput) {
  if (typeof window === "undefined") return;

  const tasks = readInterviewTaskHistory();
  const now = nowIso();
  const summary = input.summary || {};

  const topic = (summary.topic || input.topic || "General").trim() || "General";
  const totalQuestions = Math.max(
    1,
    Math.round(
      safeNumber(summary.targetQuestions, safeNumber(input.fallbackQuestionProgress?.total, 10))
    )
  );
  const answeredQuestions = Math.max(
    0,
    Math.round(
      safeNumber(summary.coveredQuestions, safeNumber(input.fallbackQuestionProgress?.asked, 0))
    )
  );
  const progressPercent = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        safeNumber(
          input.fallbackPerformance?.progressPercent,
          totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
        )
      )
    )
  );

  const efficiency = Math.max(
    0,
    Math.min(
      100,
      Math.round(safeNumber(summary.efficiencyScore, safeNumber(input.fallbackPerformance?.efficiency, 0)))
    )
  );
  const rating = Math.max(0, Math.min(5, Math.round((efficiency / 20) * 10) / 10));

  const avgWords = Math.max(
    0,
    Math.round(safeNumber(summary.averageWordsPerAnswer, safeNumber(input.fallbackPerformance?.averageWords, 0)))
  );
  const conciseRatio = Math.max(
    0,
    Math.min(1, safeNumber(summary.conciseAnswerRatio, safeNumber(input.fallbackPerformance?.conciseRatio, 0)))
  );

  const strengths = Array.isArray(summary.strengths)
    ? summary.strengths.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    : [];
  const gaps = Array.isArray(summary.gaps)
    ? summary.gaps.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    : [];

  const existingIndex = input.sessionId
    ? tasks.findIndex((task) => task.sessionId === input.sessionId)
    : -1;

  const nextTaskNumber =
    existingIndex >= 0
      ? tasks[existingIndex].taskNumber
      : tasks.reduce((max, task) => Math.max(max, task.taskNumber), 0) + 1;

  const nextTask: InterviewTaskHistoryItem = {
    id: existingIndex >= 0 ? tasks[existingIndex].id : makeId(),
    taskNumber: nextTaskNumber,
    title: `Task ${nextTaskNumber}`,
    sessionId: input.sessionId || undefined,
    topic,
    dateKey: toLocalDateKey(now),
    createdAt: now,
    progressPercent,
    questionsAnswered: answeredQuestions,
    questionsTotal: totalQuestions,
    averageWords: avgWords,
    conciseRatio,
    efficiency,
    rating,
    feedback:
      typeof summary.finalFeedback === "string" && summary.finalFeedback.trim()
        ? summary.finalFeedback.trim()
        : "Interview completed. Keep practicing to improve consistency.",
    strengths,
    gaps,
  };

  if (existingIndex >= 0) {
    tasks[existingIndex] = nextTask;
  } else {
    tasks.unshift(nextTask);
  }

  tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  writeInterviewTaskHistory(tasks);
}

export function getTodayDateKey() {
  return toLocalDateKey(new Date());
}
