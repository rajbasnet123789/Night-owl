interface DashboardProps {
  candidateName: string;
  position: string;
  setActiveTab: (tab: string) => void;
}

function Dashboard({ candidateName, position, setActiveTab }: DashboardProps) {
  // Mock RAG items with local generated images
  const ragIndexedResources = [
    {
      id: "1",
      title: "Attention is All You...",
      desc: "The seminal paper introducing the Transformer...",
      type: "Paper",
      similarity: 0.98,
      img: "/attention_paper.png"
    },
    {
      id: "2",
      title: "Understanding LoRA",
      desc: "Explaining Low-Rank Adaptation for efficient fine-...",
      type: "Video",
      similarity: 0.89,
      img: "/lora_video.png"
    },
    {
      id: "3",
      title: "PyTorch Transformer...",
      desc: "Reference code for multi-head attention blocks.",
      type: "Repo",
      similarity: 0.82,
      img: "/pytorch_repo.png"
    },
    {
      id: "4",
      title: "Softmax Temperature...",
      desc: "Quick guide on sampling parameters and their effects.",
      type: "Note",
      similarity: 0.75,
      img: "/softmax_note.png"
    }
  ];

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Welcome back, {candidateName || "Scholar"}</h1>
        <div className="dashboard-subtitle">
          Lumina AI has indexed 12 new research papers relevant to your current focus on{" "}
          <strong style={{ color: "var(--text-main)" }}>{position || "Transformer Architectures"}</strong>.
        </div>
        <div className="badge-row">
          <span className="info-badge active">GPT-2 Roadmap Active</span>
          <span className="info-badge">LLaMA Interview Scheduled</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Learning Roadmap timeline */}
        <div className="dashboard-card">
          <div className="card-title-row">
            <div>
              <span className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15"/><path d="M15 6v15"/></svg>
                Learning Roadmap
              </span>
              <span className="card-subtitle">Generated via GPT-2 Insight Engine</span>
            </div>
          </div>

          <div className="learning-timeline">
            <div className="timeline-step">
              <div className="step-marker completed">✓</div>
              <div className="step-details">
                <div className="step-heading">Foundations of Neural Networks</div>
                <div className="step-desc">Backpropagation and Activation Functions.</div>
              </div>
            </div>

            <div className="timeline-step">
              <div className="step-marker active">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
              <div className="step-details">
                <div className="step-heading" style={{ color: "var(--color-teal)" }}>Transformer Self-Attention Mechanisms</div>
                <div className="step-desc">Multi-head attention and positional encoding depth study.</div>
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: "65%" }}></div>
                </div>
              </div>
            </div>

            <div className="timeline-step">
              <div className="step-marker locked">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div className="step-details">
                <div className="step-heading locked-text">Fine-tuning Large Language Models</div>
                <div className="step-desc">LoRA and QLoRA optimization techniques.</div>
              </div>
            </div>
          </div>
        </div>

        {/* LLaMA 3 Agent Panel */}
        <div className="agent-card">
          <div className="agent-profile">
            <div className="agent-avatar">
              <img
                className="agent-avatar-img"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="LLaMA 3 Agent Avatar"
              />
            </div>
            <div className="agent-meta">
              <span className="agent-title">LLaMA 3 Agent</span>
              <span className="agent-subtitle">Senior ML Interviewer</span>
            </div>
          </div>

          <div className="agent-quote">
            "Ready to test your knowledge on positional encodings? I've prepared 5 challenging scenarios."
          </div>

          <div className="agent-footer">
            <div className="schedule-info">
              <span className="schedule-label">Scheduled For</span>
              <span className="schedule-time">Today, 2:30 PM</span>
            </div>
            <button className="btn-join-session" onClick={() => setActiveTab("interviews")}>
              Join Session
            </button>
          </div>
        </div>
      </div>

      {/* RAG Indexed Resources */}
      <div className="section-header-row">
        <h2 className="section-title">RAG-Indexed Resources</h2>
        <span className="section-link" style={{ cursor: "pointer" }} onClick={() => setActiveTab("library")}>
          Browse all
        </span>
      </div>

      <div className="resources-horizontal-grid">
        {ragIndexedResources.map((res) => (
          <div className="resource-card-mini" key={res.id} onClick={() => setActiveTab("library")}>
            <div className="resource-card-img-placeholder">
              <img src={res.img} alt={res.title} className="resource-card-img" />
              <span
                className="resource-type-badge"
                style={{
                  backgroundColor:
                    res.type === "Paper"
                      ? "var(--color-primary)"
                      : res.type === "Video"
                      ? "#4f46e5"
                      : res.type === "Repo"
                      ? "#0f172a"
                      : "#334155",
                  border: "1px solid rgba(255, 255, 255, 0.1)"
                }}
              >
                {res.type}
              </span>
            </div>
            <div className="resource-mini-info">
              <div className="resource-mini-title">{res.title}</div>
              <div className="resource-mini-desc">{res.desc}</div>
              <div className="resource-mini-meta">
                <span>
                  Similarity: <strong className="similarity-score">{res.similarity}</strong>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;

