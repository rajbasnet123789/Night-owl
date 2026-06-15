import { useState, useEffect } from "react";

interface RoadmapProps {
  position: string;
  setActiveTab: (tab: string) => void;
  isInterviewActive: boolean;
  handleStartSession: (name: string, pos: string) => void;
}

interface Unit {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "locked";
  time_spent?: string;
  score?: string;
  progress?: number;
  badge: string;
}

function Roadmap({ position, setActiveTab, isInterviewActive, handleStartSession }: RoadmapProps) {
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/roadmap");
        const data = await response.json();
        setUnits(data);
      } catch (err) {
        console.error("Error loading roadmap from backend:", err);
        // Fallback mock data matching screenshot exactly
        setUnits([
          {
            id: "1",
            title: "Foundations of Transformer Models",
            description: "Mastered the core architecture including encoders, decoders, and linear transformations in GPT-2's initial layers.",
            status: "completed",
            time_spent: "2h 45m spent",
            score: "Quiz Results: 94%",
            badge: "COMPLETED"
          },
          {
            id: "2",
            title: "Deciphering Self-Attention",
            description: "Deep dive into multi-head attention blocks and the mathematical representation of Q, K, and V vectors.",
            status: "in_progress",
            progress: 65,
            badge: "IN PROGRESS"
          },
          {
            id: "3",
            title: "Causal Masking & Sequences",
            description: "Understand how the model prevents \"cheating\" by masking future tokens in the training sequence.",
            status: "locked",
            badge: "LOCKED"
          },
          {
            id: "4",
            title: "Multi-Head Attention Optimization",
            description: "Examine flash attention and memory efficient algorithms to speed up inference.",
            status: "locked",
            badge: "LOCKED"
          }
        ]);
      }
    };

    fetchRoadmap();
  }, []);

  return (
    <div className="roadmap-timeline-wrapper">
      <div className="dashboard-header" style={{ marginBottom: "32px" }}>
        <h1 className="library-title" style={{ fontFamily: "var(--font-display)", fontSize: "32px", color: "var(--text-main)", marginBottom: "8px" }}>
          Neural Engineering Path
        </h1>
        <div className="library-subtitle" style={{ fontSize: "14px", color: "var(--text-sub)" }}>
          Curated by <strong>Lumina AI</strong> based on your GPT-2 proficiency assessment. Your focus:{" "}
          <span style={{ color: "var(--color-teal)", fontWeight: 600 }}>Attention Mechanisms</span>.
        </div>
      </div>

      <div className="roadmap-flow-container">
        {/* Timeline Line element */}
        <div className="roadmap-timeline-line"></div>

        {units.map((unit) => {
          // Render dynamic step markers based on unit status (Image 1)
          let markerElement = null;
          if (unit.status === "completed") {
            markerElement = (
              <div className="roadmap-node-marker completed" title="Unit Completed">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            );
          } else if (unit.status === "in_progress") {
            markerElement = (
              <div className="roadmap-node-marker in_progress" title="Unit In Progress">
                {/* Sparkle SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              </div>
            );
          } else {
            markerElement = (
              <div className="roadmap-node-marker locked" title="Unit Locked">
                {/* Lock SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
            );
          }

          return (
            <div className="roadmap-node-step" key={unit.id}>
              {markerElement}
              
              <div className={`roadmap-card-item ${unit.status}`}>
                <div className="roadmap-item-header">
                  <span className={`roadmap-item-badge ${unit.status}`}>
                    {unit.badge}
                  </span>
                  {unit.time_spent && (
                    <span className="roadmap-item-time">{unit.time_spent}</span>
                  )}
                </div>

                <h3 className="roadmap-item-title">{unit.title}</h3>
                <p className="roadmap-item-desc">{unit.description}</p>

                {unit.status === "completed" && unit.score && (
                  <div className="roadmap-action-row">
                    <button className="btn-secondary" style={{ color: "var(--text-main)" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      Review Summary
                    </button>
                    <span className="info-badge" style={{ color: "var(--color-primary-light)", borderColor: "rgba(99,102,241,0.2)", background: "rgba(99,102,241,0.05)", display: "flex", gap: "4px" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      {unit.score}
                    </span>
                  </div>
                )}

                {unit.status === "in_progress" && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "12px", color: "var(--color-teal)", fontWeight: 600, marginBottom: "4px" }}>
                      <span>{unit.progress}%</span>
                    </div>
                    <div className="progress-bar-container" style={{ marginBottom: "16px" }}>
                      <div className="progress-bar" style={{ width: `${unit.progress}%` }}></div>
                    </div>
                    <div className="roadmap-action-row">
                      <button className="btn-join-session" onClick={() => setActiveTab("library")}>
                        Jump to Resource &rarr;
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          if (!isInterviewActive) {
                            handleStartSession("Scholar", position || "Python Developer");
                          } else {
                            setActiveTab("interviews");
                          }
                        }}
                      >
                        Launch AI Interviewer
                      </button>
                    </div>
                  </div>
                )}

                {unit.status === "locked" && (
                  <div className="roadmap-action-row" style={{ color: "var(--text-sub)", fontSize: "12px" }}>
                    <span>🔒 Locked until prerequisite units are completed</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Roadmap;

