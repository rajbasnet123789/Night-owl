"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, Route, Loader2, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getTodayDateKey,
  INTERVIEW_TASK_HISTORY_KEY,
  readInterviewTaskHistory,
  type InterviewTaskHistoryItem,
  writeInterviewTaskHistory,
} from "@/lib/interviewTaskHistory";
import {
  MENTORSHIP_TASKS_KEY,
  buildMentorshipTasks,
  getAssessmentInterval,
  getStageBand,
  normalizeLevel,
  readMentorshipTasks,
  upsertTodayMentorshipTask,
  type MentorshipTask,
  type SkillLevel,
  writeMentorshipTasks,
} from "@/lib/mentorshipPlan";

type RoadmapStage = {
  id: string;
  title: string;
  objectives: string;
  difficulty: string;
  band?: string;
  level?: SkillLevel;
};

type StageBand = "Stage 1-10" | "Stage 11-20" | "Stage 21-30";

type CalendarTask =
  | {
      source: "interview";
      id: string;
      dateKey: string;
      title: string;
      topic: string;
      status: "done";
      createdAt: string;
      rating?: number;
      progressPercent: number;
      feedback: string;
      metrics: { label: string; value: string }[];
    }
  | {
      source: "mentorship";
      id: string;
      dateKey: string;
      title: string;
      topic: string;
      status: "pending" | "done";
      createdAt: string;
      rating?: number;
      progressPercent: number;
      feedback: string;
      metrics: { label: string; value: string }[];
    };

type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
};

type TodoSubject = {
  id: string;
  subject: string;
  done: boolean;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TIME_BUCKETS = [
  { key: "Morning", range: "06:00-11:59" },
  { key: "Afternoon", range: "12:00-16:59" },
  { key: "Evening", range: "17:00-23:59" },
] as const;

type TimeBucketKey = (typeof TIME_BUCKETS)[number]["key"];

const FLOATING_SHAPES = [
  { top: "16%", left: "10%", size: 180, duration: 16, delay: 0, tint: "from-cyan-500/15" },
  { top: "22%", left: "78%", size: 130, duration: 13, delay: 1.2, tint: "from-indigo-500/15" },
  { top: "62%", left: "6%", size: 120, duration: 15, delay: 0.5, tint: "from-emerald-500/15" },
  { top: "74%", left: "82%", size: 160, duration: 18, delay: 1.8, tint: "from-cyan-400/10" },
] as const;

function Panel3D({ children, className, delay = 0 }: { children: ReactNode; className: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      whileHover={{ y: -8, rotateX: 6, rotateY: -6, scale: 1.01 }}
      style={{ transformStyle: "preserve-3d" }}
      className={`relative [perspective:1200px] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-cyan-400/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {children}
    </motion.div>
  );
}

function monthLabel(date: Date) {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function dateKeyFromDate(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateKeyLabel(dateKey: string) {
  const parts = dateKey.split("-").map((x) => Number(x));
  if (parts.length !== 3 || parts.some((x) => !Number.isFinite(x))) return dateKey;
  const [y, m, d] = parts;
  const date = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  const weekday = WEEKDAYS[date.getUTCDay()];
  const month = SHORT_MONTHS[(m || 1) - 1] || SHORT_MONTHS[0];
  return `${weekday}, ${month} ${d}, ${y}`;
}

function resolveTimeBucket(isoDate: string): TimeBucketKey {
  const date = new Date(isoDate);
  if (!Number.isFinite(date.getTime())) return "Morning";
  const hour = date.getUTCHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

function formatUtcTime(isoDate: string) {
  const date = new Date(isoDate);
  if (!Number.isFinite(date.getTime())) return "--:--";
  const h = `${date.getUTCHours()}`.padStart(2, "0");
  const m = `${date.getUTCMinutes()}`.padStart(2, "0");
  return `${h}:${m}`;
}

function stageBandsForLevel(level: SkillLevel): StageBand[] {
  if (level === "Easy") return ["Stage 1-10"];
  if (level === "Medium") return ["Stage 1-10", "Stage 11-20"];
  return ["Stage 1-10", "Stage 11-20", "Stage 21-30"];
}

function stageRangeLabel(level: SkillLevel | null) {
  if (!level) return "Not selected";
  if (level === "Easy") return "Stage 1-10";
  if (level === "Medium") return "Stage 1-20";
  return "Stage 1-30";
}

function normalizeTodoSubjects(input: unknown): TodoSubject[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as { id?: unknown; subject?: unknown; done?: unknown };
      if (typeof candidate.subject !== "string" || !candidate.subject.trim()) return null;

      return {
        id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id : `todo-${Date.now()}-${index}`,
        subject: candidate.subject.trim(),
        done: Boolean(candidate.done),
      } satisfies TodoSubject;
    })
    .filter((item): item is TodoSubject => item !== null);
}

export default function Home() {
  const todayDateKey = useMemo(() => getTodayDateKey(), []);
  const [topic, setTopic] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | null>(null);
  const [levelError, setLevelError] = useState<string | null>(null);
  const [todoInput, setTodoInput] = useState("");
  const [todoSubjects, setTodoSubjects] = useState<TodoSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapStage[]>([]);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [taskHistory, setTaskHistory] = useState<InterviewTaskHistoryItem[]>([]);
  const [mentorshipTasks, setMentorshipTasks] = useState<MentorshipTask[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState(todayDateKey);
  const [isDateScheduleVisible, setIsDateScheduleVisible] = useState(false);
  const [activeMonth, setActiveMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const router = useRouter();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        setAuthUser((data as { user?: AuthUser | null }).user ?? null);
      } catch {
        if (!active) return;
        setAuthUser(null);
      } finally {
        if (!active) return;
        setAuthLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      const rawLevel = window.localStorage.getItem("study.level");
      setSelectedLevel(rawLevel ? normalizeLevel(rawLevel) : null);

      const rawTodos = window.localStorage.getItem("study.todoSubjects") || "";
      if (rawTodos) {
        const normalized = normalizeTodoSubjects(JSON.parse(rawTodos) as unknown);
        if (normalized.length > 0) {
          setTodoSubjects(normalized);
          return;
        }
      }

      const rawTask = window.localStorage.getItem("study.todayTask") || "";
      if (rawTask.trim()) {
        setTodoSubjects([{ id: `todo-${Date.now()}`, subject: rawTask.trim(), done: false }]);
      }
    } catch {
      setSelectedLevel("Medium");
    }
  }, []);

  useEffect(() => {
    const syncTasks = () => {
      setTaskHistory(readInterviewTaskHistory());
      setMentorshipTasks(readMentorshipTasks());
    };

    syncTasks();
    window.addEventListener("storage", syncTasks);
    return () => {
      window.removeEventListener("storage", syncTasks);
    };
  }, []);

  useEffect(() => {
    if (authLoading || !authUser) return;

    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/todos", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active || !res.ok) return;

        const normalized = normalizeTodoSubjects((data as { todos?: unknown }).todos);
        if (normalized.length === 0) {
          const rawLocalTodos = window.localStorage.getItem("study.todoSubjects") || "";
          const localTodos = rawLocalTodos ? normalizeTodoSubjects(JSON.parse(rawLocalTodos) as unknown) : [];

          if (localTodos.length > 0) {
            setTodoSubjects(localTodos);
            const syncRes = await fetch("/api/todos", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ todos: localTodos }),
            });
            const syncData = await syncRes.json().catch(() => ({}));
            if (active && syncRes.ok) {
              setTodoSubjects(normalizeTodoSubjects((syncData as { todos?: unknown }).todos));
            }
            return;
          }
        }

        setTodoSubjects(normalized);
      } catch {
        // Keep local fallback data when todo API is unavailable.
      }
    })();

    return () => {
      active = false;
    };
  }, [authLoading, authUser]);

  const persistTodoSubjects = async (nextTodos: TodoSubject[]) => {
    if (!authLoading && authUser) {
      try {
        const res = await fetch("/api/todos", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ todos: nextTodos }),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const normalized = normalizeTodoSubjects((data as { todos?: unknown }).todos);
          setTodoSubjects(normalized);
          return;
        }
      } catch {
        // Fall through to local backup persistence.
      }
    }

    try {
      window.localStorage.setItem("study.todoSubjects", JSON.stringify(nextTodos));
    } catch {
      // ignore storage failures
    }
  };

  const allCalendarTasks = useMemo(() => {
    const interviewTasks: CalendarTask[] = taskHistory.map((task) => ({
      source: "interview",
      id: task.id,
      dateKey: task.dateKey,
      title: task.title,
      topic: task.topic,
      status: "done",
      createdAt: task.createdAt,
      rating: task.rating,
      progressPercent: task.progressPercent,
      feedback: task.feedback,
      metrics: [
        { label: "Q&A", value: `${task.questionsAnswered}/${task.questionsTotal}` },
        { label: "Avg Words", value: String(task.averageWords) },
        { label: "Concise", value: `${Math.round(task.conciseRatio * 100)}%` },
        { label: "Efficiency", value: `${task.efficiency}/100` },
      ],
    }));

    const roadmapTasks: CalendarTask[] = mentorshipTasks.map((task) => ({
      source: "mentorship",
      id: task.id,
      // Show pending tasks on due date, and completed tasks on actual completion date for proper history.
      dateKey: task.status === "done" && task.completedAt ? dateKeyFromDate(new Date(task.completedAt)) : task.dueDateKey,
      title: task.title,
      topic:
        task.type === "daily"
          ? "Today To-Do"
          : task.type === "assessment"
            ? "Retention Checkpoint"
            : task.type === "interview"
              ? "Mock Interview"
              : "Roadmap",
      status: task.status,
      createdAt: task.completedAt || task.createdAt,
      rating: task.rating,
      progressPercent: task.status === "done" ? 100 : 0,
      feedback: task.feedback || (task.status === "done" ? "Completed." : "Pending. Continue mentorship progression."),
      metrics: [
        { label: "Type", value: task.type.toUpperCase() },
        ...(task.type === "daily" ? [{ label: "Priority", value: task.priority || "Medium" }] : []),
        { label: "Level", value: task.level },
        { label: "Stage", value: task.stageNumber ? String(task.stageNumber) : "-" },
        { label: "Status", value: task.status === "done" ? "Done" : "Pending" },
      ],
    }));

    return [...interviewTasks, ...roadmapTasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [taskHistory, mentorshipTasks]);

  const tasksByDate = useMemo(() => {
    const grouped: Record<string, CalendarTask[]> = {};
    for (const task of allCalendarTasks) {
      if (!grouped[task.dateKey]) grouped[task.dateKey] = [];
      grouped[task.dateKey].push(task);
    }
    return grouped;
  }, [allCalendarTasks]);

  const selectedDateTasks = useMemo(() => tasksByDate[selectedDateKey] ?? [], [tasksByDate, selectedDateKey]);
  const selectedCompletedTasks = selectedDateTasks.filter((task) => task.status === "done");
  const selectedPendingTasks = selectedDateTasks.filter((task) => task.status !== "done");
  const ratedTasks = selectedDateTasks.filter((task) => typeof task.rating === "number");

  const selectedAssessmentTasks = selectedDateTasks.filter(
    (task) => task.source === "mentorship" && task.metrics.some((metric) => metric.label === "Type" && metric.value === "ASSESSMENT")
  );
  const selectedCompletedAssessments = selectedAssessmentTasks.filter((task) => task.status === "done");
  const selectedInterviewTasks = selectedDateTasks.filter(
    (task) =>
      task.source === "interview" ||
      (task.source === "mentorship" && task.metrics.some((metric) => metric.label === "Type" && metric.value === "INTERVIEW"))
  );
  const selectedCompletedInterviews = selectedInterviewTasks.filter((task) => task.status === "done");

  const selectedDateCompletionPercent =
    selectedDateTasks.length > 0
      ? Math.round((selectedCompletedTasks.length / selectedDateTasks.length) * 100)
      : 0;

  const selectedDateAcademicScore = ratedTasks.length > 0
    ? Math.round((ratedTasks.reduce((sum, task) => sum + Number(task.rating || 0), 0) / ratedTasks.length) * 20)
    : 0;

  const selectedAssessmentProgressPercent =
    selectedAssessmentTasks.length > 0
      ? Math.round((selectedCompletedAssessments.length / selectedAssessmentTasks.length) * 100)
      : 0;

  const selectedInterviewProgressPercent =
    selectedInterviewTasks.length > 0
      ? Math.round((selectedCompletedInterviews.length / selectedInterviewTasks.length) * 100)
      : 0;

  const selectedDateOverallProgress = Math.round(
    selectedDateCompletionPercent * 0.5 +
      selectedAssessmentProgressPercent * 0.25 +
      selectedInterviewProgressPercent * 0.25
  );

  const selectedDateProgressReport =
    selectedDateOverallProgress >= 80
      ? "Excellent consistency across tasks, assessment, and interview milestones."
      : selectedDateOverallProgress >= 50
        ? "Steady progress. Complete pending tasks and one evaluation activity to improve momentum."
        : "Low progress for this date. Focus on completing scheduled tasks and at least one interview/assessment checkpoint.";

  const selectedDateScheduleByBucket = useMemo(() => {
    const grouped: Record<TimeBucketKey, CalendarTask[]> = {
      Morning: [],
      Afternoon: [],
      Evening: [],
    };

    for (const task of selectedDateTasks) {
      grouped[resolveTimeBucket(task.createdAt)].push(task);
    }

    return TIME_BUCKETS.map((bucket) => ({
      key: bucket.key,
      range: bucket.range,
      tasks: grouped[bucket.key],
    }));
  }, [selectedDateTasks]);

  const selectedLevelStageRange = stageRangeLabel(selectedLevel);

  const monthCells = useMemo(() => {
    const monthStart = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);
    const startWeekDay = monthStart.getDay();
    const daysInMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();

    const cells: Array<{ day: number; dateKey: string } | null> = [];
    for (let i = 0; i < startWeekDay; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), day);
      cells.push({ day, dateKey: dateKeyFromDate(date) });
    }
    return cells;
  }, [activeMonth]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setAuthUser(null);
      router.refresh();
    }
  };

  const handleGenerateForSubject = async (subject: string) => {
    const normalizedSubject = subject.trim();
    const selected = selectedLevel;
    if (!authLoading && !authUser) {
      router.push("/login");
      return;
    }
    if (!selected) {
      setLevelError("Select Easy, Medium, or Hard before generating roadmap.");
      return;
    }
    if (!normalizedSubject) return;

    setLevelError(null);
    setTopic(normalizedSubject);
    setLoading(true);
    try {
      const levelStageBands = stageBandsForLevel(selected);
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: normalizedSubject,
          level: selected,
          task: normalizedSubject,
          priority: "Medium",
          stageBands: levelStageBands,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const stages: RoadmapStage[] = (data.roadmap as RoadmapStage[] | undefined) || [];
      setRoadmap(stages);

      const mentorship = buildMentorshipTasks(
        stages.map((stage) => ({ id: stage.id, title: stage.title })),
        selected,
        new Date()
      );

      setMentorshipTasks(mentorship);
      writeMentorshipTasks(mentorship);

      upsertTodayMentorshipTask({
        title: `Today Task: ${normalizedSubject}`,
        level: selected,
        priority: "Medium",
        topic: normalizedSubject,
      });

      const mergedMentorship = readMentorshipTasks();
      if (mergedMentorship.length > 0) {
        setMentorshipTasks(mergedMentorship);
      }

      try {
        localStorage.setItem("study.topic", normalizedSubject);
        localStorage.setItem("study.level", selected);
        localStorage.setItem("study.todayTask", normalizedSubject);
        localStorage.setItem("study.roadmap", JSON.stringify(stages));
        localStorage.setItem(
          "study.plan",
          JSON.stringify({
            topic: normalizedSubject,
            level: selected,
            task: normalizedSubject,
            priority: "Medium",
            stageBands: levelStageBands,
            assessmentEvery: getAssessmentInterval(selected),
            stageIds: stages.map((s) => s.id),
            createdAt: new Date().toISOString(),
          })
        );
      } catch {
        // ignore storage failures (private mode, etc.)
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleAddTodoSubject = () => {
    const subject = todoInput.trim();
    if (!subject) return;

    const nextTodos = [{ id: `todo-${Date.now()}`, subject, done: false }, ...todoSubjects];
    setTodoSubjects(nextTodos);
    void persistTodoSubjects(nextTodos);
    setTodoInput("");
  };

  const toggleTodoSubject = (id: string, done: boolean) => {
    const nextTodos = todoSubjects.map((item) => (item.id === id ? { ...item, done } : item));
    setTodoSubjects(nextTodos);
    void persistTodoSubjects(nextTodos);
  };

  const handleResetAllData = async () => {
    const confirmed = window.confirm("Reset all scheduled tasks, progress data, roadmap, and to-do items?");
    if (!confirmed) return;

    setLoading(true);
    try {
      setRoadmap([]);
      setTopic("");
      setTodoInput("");
      setTodoSubjects([]);
      setMentorshipTasks([]);
      setTaskHistory([]);
      setSelectedDateKey(todayDateKey);
      setIsDateScheduleVisible(false);
      setSelectedLevel(null);
      setLevelError(null);

      writeMentorshipTasks([]);
      writeInterviewTaskHistory([]);
      await persistTodoSubjects([]);

      const keysToRemove = [
        "study.topic",
        "study.level",
        "study.todayTask",
        "study.taskPriority",
        "study.plan",
        "study.roadmap",
        "study.todoSubjects",
        "study.interview.performance",
        MENTORSHIP_TASKS_KEY,
        INTERVIEW_TASK_HISTORY_KEY,
      ];

      for (const key of keysToRemove) {
        window.localStorage.removeItem(key);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 overflow-x-hidden selection:bg-cyan-500/30">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-cyan-900/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-1/4 -right-1/4 w-[800px] h-[800px] bg-indigo-900/20 blur-[120px] rounded-full mix-blend-screen" />
        {FLOATING_SHAPES.map((shape, idx) => (
          <motion.div
            key={`float-shape-${idx}`}
            className={`absolute rounded-full bg-gradient-to-br ${shape.tint} to-transparent blur-3xl`}
            style={{ top: shape.top, left: shape.left, width: shape.size, height: shape.size }}
            animate={{ y: [0, -26, 0], x: [0, 14, 0], rotate: [0, 10, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: shape.duration, delay: shape.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between p-6 md:px-12 backdrop-blur-md border-b border-white/5">
        <div onClick={() => setRoadmap([])} className="flex items-center gap-3 cursor-pointer group">
          <motion.div
            whileHover={{ rotateY: 14, rotateX: -8, y: -2 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="p-2 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-xl group-hover:scale-110 transition-transform"
            style={{ transformStyle: "preserve-3d" }}
          >
            <Route className="w-6 h-6 text-white" />
          </motion.div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            ThinkTrack
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-base font-medium text-slate-400 hover:text-white cursor-pointer transition-colors">Dashboard</span>
          {authLoading ? null : authUser ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm font-bold text-slate-200"
              >
                Logout
              </button>
              <div className="w-12 h-12 rounded-full border border-white/10 bg-slate-900 flex items-center justify-center">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                  alt="avatar"
                  className="w-10 h-10 rounded-full"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/login")}
                className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm font-bold text-slate-200"
              >
                Login
              </button>
              <button
                onClick={() => router.push("/register")}
                className="px-5 py-2.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors text-sm font-bold text-cyan-300"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center">
        <div className="w-full max-w-5xl mb-12">
          <div className="grid grid-cols-1 gap-6">
            <Panel3D className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur max-w-md w-full mx-auto" delay={0.05}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold tracking-widest uppercase text-cyan-300 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" /> Task Calendar
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const now = new Date();
                      setActiveMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                      setSelectedDateKey(todayDateKey);
                      setIsDateScheduleVisible(true);
                    }}
                    className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => void handleResetAllData()}
                    className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-rose-400/50 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                  >
                    Reset All
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1))}
                  className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-slate-200">{monthLabel(activeMonth)}</span>
                <button
                  onClick={() => setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1))}
                  className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-[11px] uppercase tracking-widest text-slate-500 mb-2">
                {WEEKDAYS.map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthCells.map((cell, idx) => {
                  if (!cell) {
                    return <div key={`empty-${idx}`} className="h-10" />;
                  }
                  const dayTasks = tasksByDate[cell.dateKey] ?? [];
                  const isSelected = cell.dateKey === selectedDateKey;
                  const isToday = cell.dateKey === todayDateKey;

                  return (
                    <button
                      key={cell.dateKey}
                      onClick={() => {
                        if (cell.dateKey === selectedDateKey) {
                          setIsDateScheduleVisible((prev) => !prev);
                          return;
                        }
                        setSelectedDateKey(cell.dateKey);
                        setIsDateScheduleVisible(true);
                      }}
                      className={`h-10 rounded-xl text-sm font-semibold border transition-colors relative ${
                        isSelected
                          ? "border-cyan-400/80 bg-cyan-500/20 text-cyan-200"
                          : isToday
                            ? "border-indigo-400/70 bg-indigo-500/15 text-indigo-200"
                            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {cell.day}
                      {dayTasks.length > 0 ? (
                        <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-[10px] leading-[18px] text-black font-bold">
                          {dayTasks.length}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </Panel3D>

            {isDateScheduleVisible ? (
              <Panel3D className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur" delay={0.1}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <h3 className="text-sm font-bold tracking-widest uppercase text-emerald-300">
                    Date Schedule: {formatDateKeyLabel(selectedDateKey)}
                  </h3>
                  <span className="text-sm font-semibold text-cyan-300">Overall Progress: {selectedDateOverallProgress}%</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-4">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
                    Scheduled: <span className="text-slate-100 font-semibold">{selectedDateTasks.length}</span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
                    Completed: <span className="text-slate-100 font-semibold">{selectedCompletedTasks.length}</span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
                    Pending: <span className="text-slate-100 font-semibold">{selectedPendingTasks.length}</span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
                    Task Completion: <span className="text-slate-100 font-semibold">{selectedDateCompletionPercent}%</span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
                    Assessment Progress: <span className="text-slate-100 font-semibold">{selectedAssessmentProgressPercent}%</span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
                    Interview Progress: <span className="text-slate-100 font-semibold">{selectedInterviewProgressPercent}%</span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
                    Quality Score: <span className="text-slate-100 font-semibold">{selectedDateAcademicScore}/100</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-slate-200 mb-4">
                  {selectedDateProgressReport}
                </div>

                {selectedDateTasks.length === 0 ? (
                  <p className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-400">
                    No tasks scheduled for this date yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {selectedDateScheduleByBucket
                      .filter((bucket) => bucket.tasks.length > 0)
                      .map((bucket) => {
                        const bucketCompleted = bucket.tasks.filter((task) => task.status === "done").length;
                        const bucketCompletion = Math.round((bucketCompleted / bucket.tasks.length) * 100);

                        return (
                          <div key={bucket.key} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <p className="text-sm font-semibold text-cyan-300">
                                {bucket.key} Window ({bucket.range})
                              </p>
                              <p className="text-xs text-slate-300">
                                {bucketCompleted}/{bucket.tasks.length} done ({bucketCompletion}%)
                              </p>
                            </div>

                            <div className="space-y-2">
                              {bucket.tasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                                  <div>
                                    <p className="text-sm text-slate-100 font-semibold">{task.title}</p>
                                    <p className="text-xs text-slate-500">{task.topic} • {formatUtcTime(task.createdAt)} UTC</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-slate-300">{task.status === "done" ? "Completed" : "Pending"}</p>
                                    <p className="text-[11px] text-cyan-300">{task.progressPercent}% complete</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </Panel3D>
            ) : (
              <Panel3D className="group rounded-2xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-6 text-center text-sm text-slate-400" delay={0.1}>
                Click any date to view schedule and progress details. Click the same date again to hide.
              </Panel3D>
            )}
          </div>

        </div>
        
        <AnimatePresence mode="wait">
          {roadmap.length === 0 ? (
            <motion.div 
              key="onboarding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full max-w-3xl flex flex-col items-center gap-12 mt-10"
            >
              <div className="text-center space-y-6">
                <motion.div 
                  initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-base font-semibold tracking-wide"
                >
                  <Sparkles className="w-5 h-5" /> AI-Powered Curriculum
                </motion.div>
                <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight leading-tight">
                  What do you want <br className="hidden md:block"/> to master today?
                </h1>
                <p className="text-slate-400 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
                  Add subject items to your to-do list and click any subject to instantly generate a roadmap.
                </p>
              </div>

              <Panel3D className="group w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-5" delay={0.15}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Today To-Do Subjects</p>
                  <span className="text-[11px] text-slate-500">Roadmap depth: {selectedLevel ?? "Not selected"} ({selectedLevelStageRange})</span>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Select Level First</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Easy", "Medium", "Hard"] as SkillLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          setSelectedLevel(level);
                          setLevelError(null);
                        }}
                        className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                          selectedLevel === level
                            ? "border-cyan-400/70 bg-cyan-500/20 text-cyan-200"
                            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    {selectedLevel
                      ? `${selectedLevel} selected. Click any subject below to generate the roadmap.`
                      : "Choose Easy, Medium, or Hard before generating roadmap."}
                  </p>
                  {levelError ? <p className="text-[11px] text-rose-300 mt-2">{levelError}</p> : null}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={todoInput}
                    onChange={(e) => setTodoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTodoSubject();
                    }}
                    placeholder="Add subject (e.g. Python, System Design, DSA)"
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    onClick={handleAddTodoSubject}
                    className="rounded-xl border border-cyan-400/60 bg-cyan-500/20 hover:bg-cyan-500/30 px-6 py-3 text-sm font-bold uppercase tracking-widest text-cyan-200 transition-colors"
                  >
                    Add
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {todoSubjects.length === 0 ? (
                    <p className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-400">
                      Add a subject, then click it to generate your roadmap.
                    </p>
                  ) : (
                    todoSubjects.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={(e) => toggleTodoSubject(item.id, e.target.checked)}
                          className="h-4 w-4 accent-cyan-400"
                        />
                        <button
                          onClick={() => handleGenerateForSubject(item.subject)}
                          disabled={loading}
                          className={`flex-1 text-left text-base transition-colors ${
                            item.done ? "text-slate-500 line-through" : "text-slate-100 hover:text-cyan-300"
                          } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          {item.subject}
                        </button>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin text-cyan-300" /> : null}
                      </div>
                    ))
                  )}
                </div>
              </Panel3D>
            </motion.div>
          ) : (
            <motion.div 
              key="roadmap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-5xl"
            >
              <div className="text-center mb-20">
                <h2 className="text-5xl md:text-7xl font-extrabold mb-6">{topic} Mastery</h2>
                <p className="text-slate-400 text-xl md:text-2xl">Your {selectedLevel ?? "Medium"} mentorship journey across {selectedLevelStageRange} with assessments every {getAssessmentInterval(selectedLevel ?? "Medium")} sessions.</p>

                <div className="mt-10 flex justify-center">
                  <button
                    onClick={() => {
                      const firstId = roadmap?.[0]?.id;
                      if (firstId) router.push(`/stage/${firstId}`);
                    }}
                    className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-lg font-bold px-10 py-5 rounded-2xl flex items-center gap-3 transition-all transform active:scale-95"
                  >
                    Start Stage 1
                  </button>
                </div>
              </div>

              <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-0 bottom-0 left-12 md:left-1/2 w-1 bg-white/10 -ml-[2px]" />

                <div className="space-y-12">
                  {roadmap.map((stage, i) => {
                    const isLeft = i % 2 === 0;
                    return (
                      <div key={i} className={`relative flex items-center md:justify-between w-full ${isLeft ? 'flex-row-reverse' : ''}`}>
                        
                        {/* Empty Space for desktop alternation */}
                        <div className="hidden md:block w-5/12" />

                        {/* Center Node */}
                        <motion.div 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }} 
                          transition={{ delay: i * 0.1, type: "spring" }}
                          className="absolute left-12 md:left-1/2 -ml-6 w-12 h-12 rounded-full border-4 border-[#0a0a0f] bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center justify-center z-10 glow-cyan shadow-xl cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => router.push(`/stage/${stage.id}`)}
                        >
                          <BookOpen className="w-5 h-5 text-white" />
                        </motion.div>

                        {/* Content Card */}
                        <motion.div 
                          initial={{ opacity: 0, x: isLeft ? 50 : -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.15 + 0.2 }}
                          whileHover={{ y: -10, rotateX: 4, rotateY: isLeft ? -5 : 5, scale: 1.01 }}
                          onClick={() => router.push(`/stage/${stage.id}`)}
                          className="w-full md:w-5/12 pl-28 md:pl-0 pr-0"
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          <div className={`glass-panel p-8 rounded-3xl hover:bg-white-[0.05] transition-all cursor-pointer group shadow-[0_20px_45px_rgba(8,145,178,0.12)] ${isLeft ? 'hover:border-cyan-500/50' : 'hover:border-indigo-500/50'}`}>
                            <div className="flex items-center gap-3 mb-3">
                              <span className={`text-sm font-bold uppercase tracking-widest ${isLeft ? 'text-cyan-400' : 'text-indigo-400'}`}>
                                Stage {String(i + 1).padStart(2, "0")}
                              </span>
                              <span className="text-xs text-slate-500 uppercase tracking-widest">
                                {stage.band || getStageBand(i + 1)}
                              </span>
                            </div>
                            <h3 className="text-3xl font-bold mb-4 group-hover:text-white transition-colors">{stage.title}</h3>
                            <p className="text-slate-400 text-base leading-relaxed">{stage.objectives || "Dive into the core protocols and essential architectural patterns necessary to clear this boundary."}</p>
                          </div>
                        </motion.div>
                        
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
