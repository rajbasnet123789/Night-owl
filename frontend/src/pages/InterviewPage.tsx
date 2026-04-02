import { motion, AnimatePresence } from "framer-motion";
import { Upload, Link, BookOpen, MessageSquare, Camera, ScanEye, ShieldCheck, Mic, MicOff, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useCallback, useEffect } from "react";
import { BotAvatar } from "@/components/interview/BotAvatar";
import { RetinaScanOverlay } from "@/components/interview/RetinaScanOverlay";
import { InterviewFeedback } from "@/components/interview/InterviewFeedback";

const difficulties = ["Beginner", "Intermediate", "Advanced"] as const;

type InterviewPhase = "setup" | "retina-scan" | "interview" | "feedback";

const interviewQuestions = [
  "Tell me about your experience with {topic}. What projects have you worked on?",
  "How do you handle tight deadlines and pressure?",
  "What's your approach to debugging complex issues?",
];

export default function InterviewPage() {
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [topic, setTopic] = useState("");
  const [phase, setPhase] = useState<InterviewPhase>("setup");
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [botSpeaking, setBotSpeaking] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const requestCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraAllowed(true);
      setCameraError("");
    } catch {
      setCameraError("Camera access denied. Please allow camera to proceed.");
    }
  }, []);

  const startInterview = useCallback(() => {
    if (!cameraAllowed) return;
    setPhase("retina-scan");
  }, [cameraAllowed]);

  const handleScanComplete = useCallback((success: boolean) => {
    if (success) {
      setPhase("interview");
      setCurrentQ(0);
      setAnswers([]);
      setTimeout(() => setBotSpeaking(true), 500);
      setTimeout(() => setBotSpeaking(false), 4000);
    } else {
      setPhase("setup");
      setCameraError("Retina verification failed. Please try again.");
    }
  }, []);

  const handleSendAnswer = useCallback(() => {
    if (!currentAnswer.trim()) return;
    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentQ < interviewQuestions.length - 1) {
      setCurrentQ((q) => q + 1);
      setBotSpeaking(true);
      setTimeout(() => setBotSpeaking(false), 3000);
    } else {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setPhase("feedback");
    }
  }, [currentAnswer, answers, currentQ]);

  const handleRetry = useCallback(() => {
    setPhase("setup");
    setCurrentQ(0);
    setAnswers([]);
    setCurrentAnswer("");
    setCameraAllowed(false);
  }, []);

  const toggleMic = () => setMicOn(!micOn);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const displayQuestion = interviewQuestions[currentQ]?.replace("{topic}", topic || "this field") ?? "";

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">AI Interview</h1>
        <p className="text-muted-foreground mt-1">Practice with AI-generated interview questions</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* SETUP */}
        {phase === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Camera & Microphone Access</p>
                  <p className="text-xs text-muted-foreground">Required for retina verification and live interview</p>
                </div>
              </div>
              {!cameraAllowed ? (
                <Button onClick={requestCamera} className="gap-2">
                  <Camera className="h-4 w-4" /> Allow Camera Access
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span className="text-sm text-primary">Camera & microphone connected</span>
                </div>
              )}
              {cameraError && <p className="text-sm text-destructive">{cameraError}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Upload, label: "Upload Resume", desc: "PDF, DOCX" },
                { icon: Link, label: "Paste Link", desc: "Portfolio, GitHub" },
                { icon: BookOpen, label: "Enter Topic", desc: "E.g. React, DSA" },
              ].map((item, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-card p-4 text-center">
                  <item.icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <Input
              placeholder="Enter interview topic..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-card border-border/50"
            />

            <div className="flex gap-2">
              {difficulties.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    difficulty === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-surface-hover"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <Button onClick={startInterview} disabled={!cameraAllowed} className="w-full gap-2">
              <ScanEye className="h-4 w-4" /> Verify & Start Interview
            </Button>
          </motion.div>
        )}

        {/* RETINA SCAN */}
        {phase === "retina-scan" && (
          <motion.div key="retina" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RetinaScanOverlay videoRef={videoRef} onComplete={handleScanComplete} />
          </motion.div>
        )}

        {/* INTERVIEW */}
        {phase === "interview" && (
          <motion.div key="interview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {interviewQuestions.map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= currentQ ? "bg-primary" : "bg-border"}`} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{currentQ + 1}/{interviewQuestions.length}</span>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              {botSpeaking ? "AI Interviewer is speaking..." : "Your turn to answer"}
            </p>

            <BotAvatar speaking={botSpeaking} />

            <div className="rounded-xl border border-border/50 bg-card p-4">
              <p className="text-sm text-foreground italic">"{displayQuestion}"</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">You</span>
              <div className="flex-1" />
              <span className="text-xs text-destructive font-mono">● LIVE</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={toggleMic} className="rounded-full">
                {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => {
                  streamRef.current?.getTracks().forEach((t) => t.stop());
                  setPhase("feedback");
                }}
                className="rounded-full"
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Type your answer..."
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendAnswer()}
                className="bg-card border-border/50"
              />
              <Button onClick={handleSendAnswer}>
                {currentQ < interviewQuestions.length - 1 ? "Next" : "Finish"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* FEEDBACK */}
        {phase === "feedback" && (
          <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <InterviewFeedback topic={topic} difficulty={difficulty} onRetry={handleRetry} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
