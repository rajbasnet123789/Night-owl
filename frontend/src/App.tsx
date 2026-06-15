import React, { useState, useEffect } from "react";
import "./App.css";
import Dashboard from "./components/Dashboard";
import Roadmap from "./components/Roadmap";
import Interviews from "./components/Interviews";
import Library from "./components/Library";

export interface Message {
  role: "assistant" | "user";
  content: string;
  timestamp?: string;
  tags?: string[];
}

function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [candidateName, setCandidateName] = useState<string>("Scholar");
  const [position, setPosition] = useState<string>("Python Developer");
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Active session parameters
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInterviewActive, setIsInterviewActive] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>("Welcome to Lumina AI. Let's begin the interview!");
  const [initialAudio, setInitialAudio] = useState<string | null>(null);
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

  // Incremental Timer logic
  useEffect(() => {
    let interval: any = null;
    if (isInterviewActive) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isInterviewActive]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartSession = async (name: string, pos: string) => {
    setCandidateName(name);
    setPosition(pos);
    
    try {
      const response = await fetch("http://127.0.0.1:8000/api/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidate_name: name,
          position: pos,
        }),
      });
      const data = await response.json();
      if (data.session_id) {
        setSessionId(data.session_id);
        setIsInterviewActive(true);
        setFeedback(data.feedback || "Session started!");
        setMessages([
          {
            role: "assistant",
            content: data.message,
            tags: ["Introduction", "Background"],
          },
        ]);
        if (data.audio) {
          setInitialAudio(data.audio);
        }
        setActiveTab("interviews");
      }
    } catch (err) {
      console.error("Error starting backend session:", err);
      // Fallback local start if backend server is not reachable
      setSessionId("local_mock_session_id");
      setIsInterviewActive(true);
      setFeedback("Welcome to Lumina AI. Let's begin the interview!");
      setMessages([
        {
          role: "assistant",
          content: `Hello ${name}! Welcome to your interview for the ${pos} position. I'm your AI interviewer. Let's begin. Can you start by telling me about yourself and your background?`,
          tags: ["Introduction", "Background"],
        },
      ]);
      setActiveTab("interviews");
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    try {
      const response = await fetch("http://127.0.0.1:8000/api/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await response.json();
      if (data) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
            tags: ["Closing", "Wrap-up"],
          },
        ]);
        setIsInterviewActive(false);
      }
    } catch (err) {
      console.error("Error ending session:", err);
      // Fallback
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Thank you for participating in this interview. We'll be in touch soon with next steps. Have a great day!",
          tags: ["Closing", "Wrap-up"],
        },
      ]);
      setIsInterviewActive(false);
    }
  };

  const showSetup = !sessionId;
  const isInterviewTab = activeTab === "interviews";

  return (
    <div className="app-container">
      {/* Sidebar Navigation - Hidden during coding interviews (Image 2) */}
      {!isInterviewTab && !showSetup && (
        <div className="sidebar">
          <div>
            <div className="logo-section">
              <div className="logo-icon">🦉</div>
              <div className="logo-text">Lumina AI</div>
            </div>

            <div className="tutor-status-box">
              <div className="tutor-avatar-icon">🤖</div>
              <div className="tutor-status-text">
                <span className="tutor-name">The Quiet Expert</span>
                {isInterviewActive ? (
                  <span className="tutor-active">
                    ● AI Tutor Active
                  </span>
                ) : (
                  <span className="tutor-idle">
                    ● AI Tutor Idle
                  </span>
                )}
              </div>
            </div>

            <ul className="nav-links">
              <li
                className={`nav-item ${activeTab === "dashboard" || activeTab === "roadmap" ? "active" : ""}`}
                onClick={() => setActiveTab("dashboard")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15"/><path d="M15 6v15"/></svg>
                Roadmap
              </li>
              <li
                className={`nav-item ${activeTab === "interviews" ? "active" : ""}`}
                onClick={() => setActiveTab("interviews")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Interviews
              </li>
              <li
                className={`nav-item ${activeTab === "library" ? "active" : ""}`}
                onClick={() => setActiveTab("library")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
                Library
              </li>
            </ul>
          </div>

          <div className="sidebar-footer">
            {showSetup ? (
              <button
                className="btn-start-session"
                onClick={() => handleStartSession("Scholar", "Python Developer")}
              >
                Start Study Session
              </button>
            ) : (
              isInterviewActive ? (
                <button
                  className="btn-start-session"
                  style={{ background: "linear-gradient(135deg, #ef4444, #b91c1c)", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)" }}
                  onClick={handleEndSession}
                >
                  End Study Session
                </button>
              ) : (
                <button
                  className="btn-start-session"
                  onClick={() => handleStartSession("Scholar", "Python Developer")}
                >
                  Start Study Session
                </button>
              )
            )}
            <div className="sidebar-bottom-links">
              <div className="bottom-link">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Help
              </div>
              <div
                className="bottom-link"
                onClick={() => {
                  setSessionId(null);
                  setIsInterviewActive(false);
                  setMessages([]);
                  setTimerSeconds(0);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Panel Content Area */}
      <div className="main-wrapper">
        {/* Top Header */}
        {!showSetup && (
          <header className="main-header">
            <div className="header-left-nav">
              <div className="header-brand" onClick={() => setActiveTab("dashboard")}>
                Lumina AI
              </div>

              {/* Dynamic Header Tab Switchers matching Mockups */}
              {isInterviewTab ? (
                <div className="topic-tag">
                  TOPIC:
                  <span>{position || "Graph Traversal Algorithms"}</span>
                </div>
              ) : (
                <>
                  {/* If Roadmap sidebar active, display Dashboard/Resources/Analytics subtabs */}
                  {(activeTab === "dashboard" || activeTab === "roadmap") ? (
                    <ul className="subtabs-menu">
                      <li
                        className={`subtab-item ${activeTab === "dashboard" ? "active" : ""}`}
                        onClick={() => setActiveTab("dashboard")}
                      >
                        Dashboard
                      </li>
                      <li
                        className={`subtab-item ${activeTab === "roadmap" ? "active" : ""}`}
                        onClick={() => setActiveTab("roadmap")}
                      >
                        Resources
                      </li>
                      <li
                        className="subtab-item"
                        onClick={() => alert("Analytics view is currently under index setup.")}
                      >
                        Analytics
                      </li>
                    </ul>
                  ) : (
                    /* Default global primary navigation matching Image 3 */
                    <ul className="header-menu">
                      <li
                        className="header-menu-item"
                        onClick={() => setActiveTab("dashboard")}
                      >
                        Roadmap
                      </li>
                      <li
                        className={`header-menu-item ${activeTab === "interviews" ? "active" : ""}`}
                        onClick={() => setActiveTab("interviews")}
                      >
                        Interviews
                      </li>
                      <li
                        className={`header-menu-item ${activeTab === "library" ? "active" : ""}`}
                        onClick={() => setActiveTab("library")}
                      >
                        Library
                      </li>
                    </ul>
                  )}
                </>
              )}
            </div>

            <div className="header-actions">
              {/* Search bar inside header for Library tab (Image 3) */}
              {activeTab === "library" && (
                <div className="header-search-container">
                  <svg className="header-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    type="text"
                    className="header-search-input"
                    placeholder="Global search..."
                    disabled
                  />
                </div>
              )}

              {/* Stopwatch timer display (Image 2) */}
              {isInterviewTab && (
                <div className="timer-box">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {formatTimer(timerSeconds)}
                </div>
              )}

              <div className="action-icon" title="Notifications">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              </div>
              <div className="action-icon" title="Settings">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </div>
              <div className="user-profile" title="Scholar Profile">
                <img
                  className="profile-avatar"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Scholar Portrait"
                  onError={(e) => {
                    // Fallback to text initials if offline
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </header>
        )}

        {/* Content Body pages */}
        <main className={showSetup ? "" : "page-container"}>
          {showSetup ? (
            <div className="setup-container">
              <div className="setup-card">
                <div className="setup-logo-row">
                  <div className="logo-icon">🦉</div>
                  <div className="setup-title">Lumina AI</div>
                </div>
                <div className="setup-header-text">
                  <div className="setup-desc">
                    Welcome to Lumina AI. Configure your candidate credentials and target role to launch your interactive workspace.
                  </div>
                </div>
                <SetupForm onSubmit={handleStartSession} />
              </div>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <Dashboard
                  candidateName={candidateName}
                  position={position}
                  setActiveTab={setActiveTab}
                />
              )}
              {activeTab === "roadmap" && (
                <Roadmap
                  position={position}
                  setActiveTab={setActiveTab}
                  isInterviewActive={isInterviewActive}
                  handleStartSession={handleStartSession}
                />
              )}
              {activeTab === "interviews" && (
                <Interviews
                  sessionId={sessionId!}
                  messages={messages}
                  setMessages={setMessages}
                  feedback={feedback}
                  setFeedback={setFeedback}
                  isInterviewActive={isInterviewActive}
                  setIsInterviewActive={setIsInterviewActive}
                  initialAudio={initialAudio}
                />
              )}
              {activeTab === "library" && <Library />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

interface SetupFormProps {
  onSubmit: (name: string, pos: string) => void;
}

function SetupForm({ onSubmit }: SetupFormProps) {
  const [name, setName] = useState("");
  const [pos, setPos] = useState("Python Developer");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name.trim() || "Scholar", pos);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="modal-form-group">
        <label className="modal-label">Candidate Name</label>
        <input
          type="text"
          className="modal-input"
          placeholder="e.g. John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="modal-form-group">
        <label className="modal-label">Target Role / Interview Position</label>
        <select
          className="modal-input"
          value={pos}
          onChange={(e) => setPos(e.target.value)}
          style={{ background: "#0f172a", color: "#cbd5e1" }}
        >
          <option value="Python Developer">Python Developer</option>
          <option value="Software Engineer">Software Engineer</option>
          <option value="Machine Learning Engineer">Machine Learning Engineer</option>
          <option value="Data Scientist">Data Scientist</option>
        </select>
      </div>

      <button type="submit" className="btn-setup-submit">
        Start Interactive Interview
      </button>
    </form>
  );
}

export default App;
