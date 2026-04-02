import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, XCircle, AlertTriangle, TrendingUp,
  Target, BookOpen, RotateCcw, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FeedbackItem {
  question: string;
  userAnswer: string;
  idealAnswer: string;
  score: number;
  feedback: string;
}

interface InterviewFeedbackProps {
  topic: string;
  difficulty: string;
  onRetry: () => void;
}

const mockFeedback: FeedbackItem[] = [
  {
    question: "Tell me about your experience with this field. What projects have you worked on?",
    userAnswer: "I've worked on a few projects using React and Node.js, mainly small apps.",
    idealAnswer: "A strong answer would highlight 2-3 specific projects with measurable impact, technologies used, team size, and your role.",
    score: 55,
    feedback: "Your answer lacks specificity. Quantify your impact — mention user counts, performance improvements, or business outcomes.",
  },
  {
    question: "How do you handle tight deadlines and pressure?",
    userAnswer: "I try to stay calm and prioritize tasks.",
    idealAnswer: "Describe a specific high-pressure situation, how you broke down the work, communicated with stakeholders, and delivered on time.",
    score: 40,
    feedback: "Too generic. Interviewers want concrete examples. Prepare 2-3 stories about deadline scenarios using the STAR method.",
  },
  {
    question: "What's your approach to debugging complex issues?",
    userAnswer: "I use console logs and check the documentation.",
    idealAnswer: "Explain a systematic approach: reproduce the issue, isolate variables, use debugging tools, check logs, write failing tests, then fix.",
    score: 45,
    feedback: "Shows basic awareness but lacks depth. Mention specific debugging tools and systematic approaches.",
  },
];

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "text-primary" : score >= 50 ? "text-streak" : "text-destructive";
  const bgColor = score >= 70 ? "bg-primary/10" : score >= 50 ? "bg-streak/10" : "bg-destructive/10";
  return (
    <div className={`flex items-center justify-center h-12 w-12 rounded-full ${bgColor}`}>
      <span className={`text-sm font-bold ${color}`}>{score}%</span>
    </div>
  );
}

function getScoreIcon(score: number) {
  if (score >= 70) return <CheckCircle2 className="h-5 w-5 text-primary" />;
  if (score >= 50) return <AlertTriangle className="h-5 w-5 text-streak" />;
  return <XCircle className="h-5 w-5 text-destructive" />;
}

export function InterviewFeedback({ topic, difficulty, onRetry }: InterviewFeedbackProps) {
  const navigate = useNavigate();
  const overallScore = Math.round(mockFeedback.reduce((sum, f) => sum + f.score, 0) / mockFeedback.length);

  const strengths = [
    "Basic awareness of core concepts",
    "Calm demeanor under questioning",
    "Willingness to share experiences",
  ];

  const improvements = [
    "Use the STAR method for behavioral questions",
    "Quantify achievements with specific metrics",
    "Prepare 5-6 detailed project stories",
    "Practice articulating debugging methodology",
    "Research the company before interviews",
  ];

  const resources = [
    "Practice mock interviews on similar topics",
    "Review common behavioral question frameworks",
    `Deep-dive into ${topic || "your target domain"} fundamentals`,
    "Record yourself answering and review for filler words",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex items-start gap-4">
          <ScoreRing score={overallScore} />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">Interview Performance Report</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Topic: <span className="text-foreground">{topic || "General"}</span> ·{" "}
              Difficulty: <span className="text-foreground">{difficulty}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {overallScore >= 70
                ? "Great job! You demonstrated strong interview skills."
                : overallScore >= 50
                ? "Decent attempt, but there's room for improvement in key areas."
                : "Needs significant improvement. Focus on the suggestions below."}
            </p>
          </div>
        </div>
      </div>

      {/* Question breakdown */}
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Question Breakdown</h3>
        {mockFeedback.map((item, i) => (
          <div key={i} className="border border-border/30 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              {getScoreIcon(item.score)}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Q{i + 1}: "{item.question}"</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                item.score >= 70 ? "bg-primary/10 text-primary" :
                item.score >= 50 ? "bg-streak/10 text-streak" :
                "bg-destructive/10 text-destructive"
              }`}>{item.score}%</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Your Answer</p>
              <p className="text-sm text-foreground mt-1">"{item.userAnswer}"</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Ideal Approach</p>
              <p className="text-sm text-foreground mt-1">{item.idealAnswer}</p>
            </div>
            <p className="text-sm text-accent">{item.feedback}</p>
          </div>
        ))}
      </div>

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" /> What You Did Well
          </h3>
          <ul className="mt-3 space-y-2">
            {strengths.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-destructive" /> Areas to Improve
          </h3>
          <ul className="mt-3 space-y-2">
            {improvements.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-destructive">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Plan */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-info" /> Recommended Next Steps
        </h3>
        <ol className="mt-3 space-y-2">
          {resources.map((r, i) => (
            <li key={i} className="text-sm text-muted-foreground flex gap-2">
              <span className="text-info font-bold">{i + 1}.</span> {r}
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" /> Retry Interview
        </Button>
        <Button onClick={() => navigate("/progress")} className="gap-2">
          View Full Progress <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
