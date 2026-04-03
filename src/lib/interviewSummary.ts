export type InterviewMessage = {
  role: string;
  text: string;
  ts?: string;
};

export type InterviewSummary = {
  topic: string;
  coveredQuestions: number;
  targetQuestions: number;
  averageWordsPerAnswer: number;
  conciseAnswerRatio: number;
  efficiencyScore: number;
  complete: boolean;
  reason: string;
  strengths: string[];
  gaps: string[];
  improvementSteps: string[];
  finalFeedback: string;
};

type SummaryOptions = {
  targetQuestions?: number;
  forceComplete?: boolean;
};

const WARMUP_PATTERNS: RegExp[] = [
  /start the interview with the first question/i,
  /i just studied .*start the interview/i,
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isWarmupAnswer(text: string) {
  return WARMUP_PATTERNS.some((p) => p.test(text));
}

function sanitizeTopic(input: string | null | undefined) {
  return (input ?? "").trim();
}

function getTargetQuestions(topic: string) {
  const topicTokens = topic
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const complexityBoost = Math.floor(topicTokens.length / 3);
  return clamp(10 + complexityBoost, 10, 20);
}

function buildFinalFeedback(summary: Omit<InterviewSummary, "finalFeedback">) {
  const header = summary.complete
    ? `Interview complete for ${summary.topic || "the selected topic"}.`
    : `Interview in progress for ${summary.topic || "the selected topic"}.`;

  const strengths = summary.strengths.length
    ? summary.strengths.map((s, i) => `${i + 1}. ${s}`).join("\n")
    : "1. You stayed engaged throughout the session.";

  const gaps = summary.gaps.length
    ? summary.gaps.map((g, i) => `${i + 1}. ${g}`).join("\n")
    : "1. No critical gaps detected.";

  const steps = summary.improvementSteps.length
    ? summary.improvementSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")
    : "1. Continue practicing similar questions to maintain consistency.";

  return [
    header,
    `Coverage: ${summary.coveredQuestions}/${summary.targetQuestions} questions, Efficiency: ${summary.efficiencyScore}/100.`,
    "",
    "Strengths:",
    strengths,
    "",
    "Where you can improve:",
    gaps,
    "",
    "Action plan:",
    steps,
  ].join("\n");
}

export function buildInterviewSummary(
  messages: InterviewMessage[],
  topicInput?: string | null,
  options?: SummaryOptions
): InterviewSummary {
  const topic = sanitizeTopic(topicInput);

  const userAnswers = messages
    .filter((m) => m && m.role === "user" && typeof m.text === "string")
    .map((m) => m.text.trim())
    .filter((text) => text.length > 0 && !isWarmupAnswer(text));

  const coveredQuestions = userAnswers.length;
  const optionTarget = Number.isFinite(options?.targetQuestions)
    ? Number(options?.targetQuestions)
    : undefined;
  const targetQuestions = clamp(optionTarget ?? getTargetQuestions(topic), 10, 20);

  const totalWords = userAnswers.reduce((sum, answer) => sum + wordCount(answer), 0);
  const averageWordsPerAnswer = coveredQuestions > 0 ? Math.round(totalWords / coveredQuestions) : 0;

  const conciseCount = userAnswers.filter((answer) => {
    const wc = wordCount(answer);
    return wc >= 12 && wc <= 70;
  }).length;
  const conciseAnswerRatio = coveredQuestions > 0 ? conciseCount / coveredQuestions : 0;

  const coverageScore = Math.round((coveredQuestions / targetQuestions) * 60);
  const conciseScore = Math.round(conciseAnswerRatio * 25);
  const depthScore = clamp(averageWordsPerAnswer, 0, 15);
  const efficiencyScore = clamp(coverageScore + conciseScore + depthScore, 0, 100);

  const strengths: string[] = [];
  if (coveredQuestions >= Math.ceil(targetQuestions * 0.8)) {
    strengths.push("You covered most core question areas for this topic.");
  }
  if (conciseAnswerRatio >= 0.6) {
    strengths.push("Your answers were mostly clear and concise.");
  }
  if (averageWordsPerAnswer >= 16 && averageWordsPerAnswer <= 55) {
    strengths.push("Your answer depth was balanced for interview pacing.");
  }

  const gaps: string[] = [];
  if (coveredQuestions < targetQuestions) {
    gaps.push(`Only ${coveredQuestions} of ${targetQuestions} target questions were covered.`);
  }
  if (conciseAnswerRatio < 0.5) {
    gaps.push("Several responses were either too short or too verbose.");
  }
  if (averageWordsPerAnswer < 12) {
    gaps.push("Some answers lacked enough technical detail.");
  }

  const improvementSteps: string[] = [];
  if (coveredQuestions < targetQuestions) {
    improvementSteps.push("Continue the interview to complete remaining topic checkpoints.");
  }
  if (averageWordsPerAnswer < 12) {
    improvementSteps.push("Use a 3-part format: concept, example, and trade-off.");
  }
  if (conciseAnswerRatio < 0.5) {
    improvementSteps.push("Keep answers in the 12-70 word range for clarity and signal.");
  }
  if (improvementSteps.length === 0) {
    improvementSteps.push("Revisit one weak area with 2 extra mock questions to lock retention.");
  }

  const complete = options?.forceComplete ? true : coveredQuestions >= targetQuestions;
  const reason = complete
    ? "All planned interview questions were completed for this topic."
    : "Interview is still in progress until all planned questions are completed.";

  const summaryBase: Omit<InterviewSummary, "finalFeedback"> = {
    topic,
    coveredQuestions,
    targetQuestions,
    averageWordsPerAnswer,
    conciseAnswerRatio,
    efficiencyScore,
    complete,
    reason,
    strengths,
    gaps,
    improvementSteps,
  };

  return {
    ...summaryBase,
    finalFeedback: buildFinalFeedback(summaryBase),
  };
}
