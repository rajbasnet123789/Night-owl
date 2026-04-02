import { motion } from "framer-motion";
import {
  CheckCircle2, MessageSquare, FileText, TrendingUp,
  AlertTriangle, Star, Target, ThumbsUp, ThumbsDown,
  Clock, Zap, BookOpen
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Mock data representing the day's activities
const todayData = {
  date: new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
  tasks: {
    total: 12,
    completed: 9,
    high: { total: 4, completed: 3 },
    medium: { total: 5, completed: 4 },
    low: { total: 3, completed: 2 },
  },
  interviews: {
    count: 2,
    avgScore: 62,
    topics: ["React Advanced", "System Design"],
    bestScore: 75,
    worstScore: 48,
  },
  assessments: {
    count: 3,
    avgScore: 78,
    categories: ["Technical (Coding)", "Non-Technical", "Academic"],
    bestScore: 92,
    worstScore: 65,
  },
};

function getOverallGrade(taskPct: number, interviewAvg: number, assessmentAvg: number) {
  const weighted = taskPct * 0.3 + interviewAvg * 0.35 + assessmentAvg * 0.35;
  if (weighted >= 85) return { grade: "A", label: "Outstanding", color: "text-primary", bg: "bg-primary/10" };
  if (weighted >= 70) return { grade: "B", label: "Good", color: "text-info", bg: "bg-info/10" };
  if (weighted >= 55) return { grade: "C", label: "Average", color: "text-streak", bg: "bg-streak/10" };
  return { grade: "D", label: "Needs Work", color: "text-destructive", bg: "bg-destructive/10" };
}

function getMoodEmoji(score: number) {
  if (score >= 85) return "🔥";
  if (score >= 70) return "😊";
  if (score >= 55) return "🤔";
  return "😤";
}

export default function FeedbackPage() {
  const navigate = useNavigate();
  const taskPct = Math.round((todayData.tasks.completed / todayData.tasks.total) * 100);
  const overall = getOverallGrade(taskPct, todayData.interviews.avgScore, todayData.assessments.avgScore);
  const overallScore = Math.round(taskPct * 0.3 + todayData.interviews.avgScore * 0.35 + todayData.assessments.avgScore * 0.35);

  const strengths = [
    taskPct >= 75 && "Strong task completion rate",
    todayData.assessments.avgScore >= 70 && "Good assessment performance",
    todayData.interviews.avgScore >= 70 && "Solid interview skills",
    todayData.tasks.high.completed === todayData.tasks.high.total && "All high-priority tasks done",
  ].filter(Boolean) as string[];

  const weaknesses = [
    taskPct < 75 && "Task completion rate below target",
    todayData.interviews.avgScore < 60 && "Interview scores need improvement",
    todayData.assessments.avgScore < 60 && "Assessment scores are low",
    todayData.tasks.high.completed < todayData.tasks.high.total && "Some high-priority tasks left incomplete",
  ].filter(Boolean) as string[];

  const tips = [
    todayData.interviews.avgScore < 70 && "Practice STAR method for interview answers",
    taskPct < 80 && "Try time-blocking to improve task completion",
    todayData.assessments.avgScore < 80 && "Review fundamentals before assessments",
    "Keep up consistency — streaks compound your learning",
  ].filter(Boolean) as string[];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Daily Feedback</h1>
        <p className="text-muted-foreground mt-1">{todayData.date}</p>
      </motion.div>

      {/* Overall Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border/50 bg-card p-8 text-center"
      >
        <p className="text-sm text-muted-foreground mb-2">Today's Overall Performance</p>
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className={`h-20 w-20 rounded-full ${overall.bg} flex items-center justify-center`}>
            <span className={`text-3xl font-bold ${overall.color}`}>{overall.grade}</span>
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold text-foreground">{overallScore}% {getMoodEmoji(overallScore)}</p>
            <p className={`text-sm font-medium ${overall.color}`}>{overall.label} Day</p>
          </div>
        </div>
        <Progress value={overallScore} className="h-3 max-w-md mx-auto" />
        <p className="text-xs text-muted-foreground mt-2">
          Based on tasks (30%), interviews (35%), and assessments (35%)
        </p>
      </motion.div>

      {/* Breakdown Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border/50 bg-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Tasks</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">{todayData.tasks.completed}/{todayData.tasks.total}</p>
          <Progress value={taskPct} className="h-2 mt-2 mb-3" />
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-destructive">High: {todayData.tasks.high.completed}/{todayData.tasks.high.total}</span>
              <span className="text-streak">Med: {todayData.tasks.medium.completed}/{todayData.tasks.medium.total}</span>
              <span className="text-primary">Low: {todayData.tasks.low.completed}/{todayData.tasks.low.total}</span>
            </div>
          </div>
        </motion.div>

        {/* Interviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border/50 bg-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-accent/10">
              <MessageSquare className="h-5 w-5 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground">Interviews</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">{todayData.interviews.avgScore}%</p>
          <Progress value={todayData.interviews.avgScore} className="h-2 mt-2 mb-3" />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{todayData.interviews.count} sessions completed</p>
            <p className="text-xs text-muted-foreground">
              Best: <span className="text-primary">{todayData.interviews.bestScore}%</span> · Worst: <span className="text-destructive">{todayData.interviews.worstScore}%</span>
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {todayData.interviews.topics.map((t) => (
                <span key={t} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Assessments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-border/50 bg-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-info/10">
              <FileText className="h-5 w-5 text-info" />
            </div>
            <h3 className="font-semibold text-foreground">Assessments</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">{todayData.assessments.avgScore}%</p>
          <Progress value={todayData.assessments.avgScore} className="h-2 mt-2 mb-3" />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{todayData.assessments.count} tests taken</p>
            <p className="text-xs text-muted-foreground">
              Best: <span className="text-primary">{todayData.assessments.bestScore}%</span> · Worst: <span className="text-destructive">{todayData.assessments.worstScore}%</span>
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {todayData.assessments.categories.map((c) => (
                <span key={c} className="text-xs bg-info/10 text-info px-2 py-0.5 rounded-full">{c}</span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-border/50 bg-card p-6"
        >
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
            <ThumbsUp className="h-5 w-5 text-primary" /> Today's Strengths
          </h3>
          {strengths.length > 0 ? (
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <Star className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Keep pushing — tomorrow will be better!</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl border border-border/50 bg-card p-6"
        >
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
            <ThumbsDown className="h-5 w-5 text-destructive" /> Areas to Focus
          </h3>
          {weaknesses.length > 0 ? (
            <ul className="space-y-2">
              {weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> {w}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No major weaknesses today — great job! 🎉</p>
          )}
        </motion.div>
      </div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-xl border border-border/50 bg-card p-6"
      >
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-info" /> Tips for Tomorrow
        </h3>
        <ul className="space-y-2">
          {tips.map((tip, i) => (
            <li key={i} className="text-sm text-muted-foreground flex gap-2">
              <Zap className="h-4 w-4 text-streak shrink-0 mt-0.5" /> {tip}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Quick navigation */}
      <div className="flex gap-3 flex-wrap">
        <Button variant="outline" onClick={() => navigate("/todo")} className="gap-2">
          <CheckCircle2 className="h-4 w-4" /> View Tasks
        </Button>
        <Button variant="outline" onClick={() => navigate("/interview")} className="gap-2">
          <MessageSquare className="h-4 w-4" /> Start Interview
        </Button>
        <Button variant="outline" onClick={() => navigate("/assessments")} className="gap-2">
          <FileText className="h-4 w-4" /> Take Assessment
        </Button>
        <Button onClick={() => navigate("/progress")} className="gap-2">
          <TrendingUp className="h-4 w-4" /> Full Progress
        </Button>
      </div>
    </div>
  );
}
