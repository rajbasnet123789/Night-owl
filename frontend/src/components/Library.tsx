import React, { useState, useEffect } from "react";

interface Resource {
  id: string;
  title: string;
  type: string;
  source: string;
  size?: string;
  tags: string[];
  similarity: number;
  status: "indexed" | "indexing";
  description: string;
}

function Library() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [viewingResource, setViewingResource] = useState<Resource | null>(null);
  
  // Add Source Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newType, setNewType] = useState<string>("Paper");
  const [newSource, setNewSource] = useState<string>("Local Files (MCP)");
  const [newSize, setNewSize] = useState<string>("1.5 MB");
  const [newTags, setNewTags] = useState<string>("tag1, tag2");
  const [newDesc, setNewDesc] = useState<string>("");

  const fetchResources = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/resources");
      const data = await response.json();
      setResources(data);
    } catch (err) {
      console.error("Error loading resources from backend:", err);
      // Fallback local data matching screenshot exactly
      setResources([
        {
          id: "1",
          title: "Macroeconomics_Th",
          type: "Paper",
          source: "Local (MCP)",
          size: "2.4 MB",
          tags: ["economics", "quant"],
          similarity: 0.95,
          status: "indexed",
          description: "Comprehensive study on interest rate parity and macro policy models."
        },
        {
          id: "2",
          title: "Transformer...",
          type: "Paper",
          source: "Web Source • arxiv.org",
          size: "1.8 MB",
          tags: ["machine-learning", "ai"],
          similarity: 0.98,
          status: "indexed",
          description: "The evolution of attention mechanisms and linear-complexity sequence models."
        },
        {
          id: "3",
          title: "Full_Course_Repo_C",
          type: "Repo",
          source: "Local (MCP)",
          size: "450 MB",
          tags: ["cs101", "python"],
          similarity: 0.82,
          status: "indexing",
          description: "Lecture notes, programming assignments, and test cases."
        },
        {
          id: "4",
          title: "Linear Algebra...",
          type: "Video",
          source: "Youtube • 12:45",
          size: "25 MB",
          tags: ["math", "visualization"],
          similarity: 0.89,
          status: "indexed",
          description: "Visual intuition for eigenvectors, eigenvalues, and transformations."
        },
        {
          id: "5",
          title: "Geopolitics in 2024",
          type: "Note",
          source: "Web Resource • nytimes.com",
          size: "12 KB",
          tags: ["geopolitics"],
          similarity: 0.75,
          status: "indexed",
          description: "Analysis of shifting power dynamics in the modern digital age."
        },
        {
          id: "6",
          title: "Market_Dataset_Q3.",
          type: "CSV",
          source: "Local (MCP) • CSV",
          tags: ["finance", "data"],
          similarity: 0.88,
          status: "indexed",
          description: "Raw market data for longitudinal study of high-frequency trades."
        },
        {
          id: "7",
          title: "RAG_Pipeline_V2",
          type: "Repo",
          source: "Github • main.py",
          tags: ["python", "rag"],
          similarity: 0.82,
          status: "indexed",
          description: "Implementation of the hybrid search and retrieval pipeline with caching."
        }
      ]);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tagsArray = newTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle,
          type: newType,
          source: newSource,
          size: newSize,
          tags: tagsArray,
          similarity: 0.7 + Math.random() * 0.25,
          description: newDesc || "Custom resource added by applicant.",
        }),
      });
      if (response.ok) {
        fetchResources();
        setNewTitle("");
        setNewDesc("");
        setNewTags("tag1, tag2");
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Error adding resource:", err);
      // Local addition fallback
      const localNew: Resource = {
        id: String(resources.length + 1),
        title: newTitle,
        type: newType,
        source: newSource,
        size: newSize,
        tags: tagsArray,
        similarity: 0.81,
        status: "indexed",
        description: newDesc || "Custom resource added by applicant."
      };
      setResources((prev) => [...prev, localNew]);
      setIsModalOpen(false);
    }
  };

  const getFilteredResources = () => {
    return resources.filter((res) => {
      // Filter tab check
      if (filter === "mcp" && !res.source.toLowerCase().includes("mcp")) return false;
      if (filter === "web" && res.source.toLowerCase().includes("mcp")) return false;

      // Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = res.title.toLowerCase().includes(query);
        const matchesDesc = res.description.toLowerCase().includes(query);
        const matchesTags = res.tags.some((tag) => tag.toLowerCase().includes(query));
        return matchesTitle || matchesDesc || matchesTags;
      }

      return true;
    });
  };

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "paper":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        );
      case "video":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
        );
      case "repo":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        );
    }
  };

  const filtered = getFilteredResources();

  return (
    <div>
      <div className="library-head-section">
        <div className="library-meta-info">
          <h1 className="library-title">Knowledge Bank</h1>
          <div className="library-subtitle">
            1,248 resources indexed across your ecosystem via RAG.
          </div>
        </div>

        <div className="library-filters-bar">
          <button
            className={`pill-filter ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Resources
          </button>
          <button
            className={`pill-filter ${filter === "mcp" ? "active" : ""}`}
            onClick={() => setFilter("mcp")}
          >
            Local Files (MCP)
          </button>
          <button
            className={`pill-filter ${filter === "web" ? "active" : ""}`}
            onClick={() => setFilter("web")}
          >
            Web Resources
          </button>
        </div>
      </div>

      {/* Search Bar Row (Image 3) */}
      <div className="search-row-container">
        <div className="search-input-wrapper">
          <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search by concept, keywords, or AI intent (e.g. 'Advanced Quant Finance' or 'Transformer')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn-search-action" onClick={() => alert("Filter controls context index tags.")}>
          {/* Sliders icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
          Filters
        </button>
        <button className="btn-search-action teal-gradient" onClick={() => alert("Opening AI Assistant chat query panel...")}>
          {/* Spark icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          Ask AI
        </button>
      </div>

      {/* Resource Grid */}
      <div className="library-cards-grid">
        {filtered.map((res) => (
          <div className="resource-card-full" key={res.id} onClick={() => setSelectedResource(res)} style={{ cursor: "pointer" }}>
            <div className="card-top-icon-row">
              <div className="card-doc-icon">
                {getResourceIcon(res.type)}
              </div>
              <span className={`index-status-pill ${res.status}`}>
                {res.status === "indexed" ? "● Context Indexed" : "● Indexing..."}
              </span>
            </div>

            <div className="resource-source-text">
              {res.source.toUpperCase()} {res.size ? `• ${res.size}` : ""}
            </div>
            <h3 className="resource-title" title={res.title}>{res.title}</h3>
            <p className="resource-desc">{res.description}</p>

            <div className="resource-tags-row">
              {res.tags.map((tag, i) => (
                <span className="resource-tag-item" key={i}>
                  #{tag}
                </span>
              ))}
              <span className="similarity-score" style={{ marginLeft: "auto", fontSize: "11px" }}>
                {res.similarity}
              </span>
            </div>
          </div>
        ))}

        {/* Add Source dashed card (Image 3) */}
        <div className="resource-card-add" onClick={() => setIsModalOpen(true)}>
          <div className="add-icon-plus">+</div>
          <span className="add-source-text">Add Source</span>
          <span className="add-source-subtext">MCP or URL</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "32px", marginBottom: "20px" }}>
        <button className="btn-secondary" style={{ padding: "10px 24px", fontSize: "13px" }}>
          Load More Resources
        </button>
      </div>

      {/* Floating Spark button */}
      <div
        className="floating-spark-action"
        title="Quick AI Assist"
        onClick={() => alert("Quick Help: Select 'Ask AI' or switch to the 'Interviews' tab to chat with the live expert!")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
      </div>

      {/* Resource Viewer Panel */}
      {viewingResource && (
        <div className="modal-overlay" onClick={() => setViewingResource(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px", maxHeight: "85vh", overflowY: "auto" }}>
            {/* Viewer Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #1e293b" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="card-doc-icon" style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "#1e293b", borderRadius: "8px" }}>
                  {getResourceIcon(viewingResource.type)}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: "#f1f5f9", fontSize: "16px" }}>{viewingResource.title}</h3>
                  <span style={{ color: "#64748b", fontSize: "11px" }}>{viewingResource.source} • {viewingResource.size}</span>
                </div>
              </div>
              <button onClick={() => setViewingResource(null)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "20px", cursor: "pointer", padding: "4px 8px" }}>✕</button>
            </div>

            {/* Viewer Content based on type */}
            <div style={{ background: "#0c1322", borderRadius: "8px", padding: "20px", marginBottom: "16px", border: "1px solid #1e293b" }}>
              <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Resource Content Preview</div>

              {viewingResource.type === "Paper" && (
                <div>
                  <div style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>{viewingResource.title}</div>
                  <div style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.6", marginBottom: "12px" }}>{viewingResource.description}</div>
                  <div style={{ background: "#111827", borderRadius: "6px", padding: "14px", marginBottom: "10px" }}>
                    <div style={{ color: "#22d3ee", fontSize: "11px", marginBottom: "6px" }}>Abstract</div>
                    <div style={{ color: "#cbd5e1", fontSize: "12px", lineHeight: "1.6" }}>
                      This paper presents a comprehensive analysis of the theoretical foundations and practical applications discussed in {viewingResource.title}. The study explores key methodologies and findings relevant to {viewingResource.tags.join(", ")} domains, providing insights into current research trends and future directions.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {viewingResource.tags.map((tag, i) => (
                      <span key={i} style={{ background: "#1e293b", color: "#22d3ee", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", border: "1px solid #0e7490" }}>#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {viewingResource.type === "Video" && (
                <div>
                  <div style={{ background: "#111827", borderRadius: "8px", height: "180px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px", border: "1px solid #1e293b" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                  <div style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{viewingResource.title}</div>
                  <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "8px" }}>Duration: {viewingResource.size}</div>
                  <div style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.6" }}>{viewingResource.description}</div>
                </div>
              )}

              {viewingResource.type === "Repo" && (
                <div>
                  <div style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>{viewingResource.title}</div>
                  <div style={{ fontFamily: "monospace", background: "#111827", borderRadius: "6px", padding: "14px", marginBottom: "10px" }}>
                    <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "8px"}}>main.py</div>
                    <pre style={{ margin: 0, color: "#a5f3fc", fontSize: "11px", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>{`class TransformerBlock(nn.Module):
    def __init__(self, embed_dim, num_heads):
        super().__init__()
        self.attention = MultiHeadAttention(embed_dim, num_heads)
        self.norm1 = LayerNorm(embed_dim)
        self.norm2 = LayerNorm(embed_dim)
        self.ffn = FeedForward(embed_dim)

    def forward(self, x):
        x = x + self.attention(self.norm1(x))
        x = x + self.ffn(self.norm2(x))
        return x`}</pre>
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: "12px" }}>{viewingResource.description}</div>
                </div>
              )}

              {viewingResource.type === "Note" && (
                <div>
                  <div style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>{viewingResource.title}</div>
                  <div style={{ background: "#111827", borderRadius: "6px", padding: "14px" }}>
                    <div style={{ color: "#cbd5e1", fontSize: "12px", lineHeight: "1.7" }}>{viewingResource.description} This note captures key observations and analysis relevant to {viewingResource.tags.join(" and ")} research areas. The document includes supporting data, contextual references, and synthesized findings from multiple sources.</div>
                  </div>
                </div>
              )}

              {viewingResource.type === "CSV" && (
                <div>
                  <div style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>{viewingResource.title}</div>
                  <div style={{ fontFamily: "monospace", background: "#111827", borderRadius: "6px", padding: "14px", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #334155" }}>
                          <th style={{ color: "#22d3ee", padding: "4px 8px", textAlign: "left" }}>date</th>
                          <th style={{ color: "#22d3ee", padding: "4px 8px", textAlign: "left" }}>asset</th>
                          <th style={{ color: "#22d3ee", padding: "4px 8px", textAlign: "left" }}>price</th>
                          <th style={{ color: "#22d3ee", padding: "4px 8px", textAlign: "left" }}>volume</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ color: "#94a3b8" }}><td style={{ padding: "4px 8px" }}>2024-01-15</td><td style={{ padding: "4px 8px" }}>AAPL</td><td style={{ padding: "4px 8px" }}>185.92</td><td style={{ padding: "4px 8px" }}>52.3M</td></tr>
                        <tr style={{ color: "#94a3b8" }}><td style={{ padding: "4px 8px" }}>2024-01-15</td><td style={{ padding: "4px 8px" }}>GOOGL</td><td style={{ padding: "4px 8px" }}>141.80</td><td style={{ padding: "4px 8px" }}>28.1M</td></tr>
                        <tr style={{ color: "#94a3b8" }}><td style={{ padding: "4px 8px" }}>2024-01-15</td><td style={{ padding: "4px 8px" }}>MSFT</td><td style={{ padding: "4px 8px" }}>388.47</td><td style={{ padding: "4px 8px" }}>21.7M</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ color: "#64748b", fontSize: "11px", marginTop: "8px" }}>{viewingResource.description}</div>
                </div>
              )}
            </div>

            {/* Viewer Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {viewingResource.tags.map((tag, i) => (
                  <span key={i} style={{ background: "#1e293b", color: "#22d3ee", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", border: "1px solid #0e7490" }}>#{tag}</span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn-secondary" onClick={() => setViewingResource(null)} style={{ padding: "6px 14px", fontSize: "12px" }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Detail Modal */}
      {selectedResource && (
        <div className="modal-overlay" onClick={() => setSelectedResource(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 className="modal-title" style={{ margin: 0 }}>{selectedResource.title}</h3>
              <button onClick={() => setSelectedResource(null)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              <span className={`index-status-pill ${selectedResource.status}`} style={{ fontSize: "11px" }}>
                {selectedResource.status === "indexed" ? "● Context Indexed" : "● Indexing..."}
              </span>
              <span style={{ background: "#1e293b", color: "#94a3b8", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", border: "1px solid #334155" }}>
                {selectedResource.type}
              </span>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Source</div>
              <div style={{ color: "#e2e8f0", fontSize: "13px" }}>{selectedResource.source} {selectedResource.size ? `• ${selectedResource.size}` : ""}</div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Description</div>
              <div style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: "1.5" }}>{selectedResource.description}</div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Tags</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {selectedResource.tags.map((tag, i) => (
                  <span key={i} style={{ background: "#1e293b", color: "#22d3ee", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", border: "1px solid #0e7490" }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid #1e293b" }}>
              <div>
                <span style={{ color: "#64748b", fontSize: "11px" }}>Similarity Score: </span>
                <span className="similarity-score" style={{ fontSize: "14px" }}>{selectedResource.similarity}</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn-secondary" onClick={() => setSelectedResource(null)} style={{ padding: "6px 14px", fontSize: "12px" }}>Close</button>
                <button className="btn-join-session" onClick={() => { setViewingResource(selectedResource); setSelectedResource(null); }} style={{ padding: "6px 14px", fontSize: "12px" }}>Open Resource</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Source Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Index New Resource</h3>
            
            <form onSubmit={handleAddSource}>
              <div className="modal-form-group">
                <label className="modal-label">Resource Title</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="e.g. attention_mechanism_paper"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Resource Type</label>
                <select
                  className="modal-input"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  style={{ background: "#0f172a", color: "#cbd5e1" }}
                >
                  <option value="Paper">Paper / PDF</option>
                  <option value="Video">Video Tutorial</option>
                  <option value="Repo">Code Repository</option>
                  <option value="Note">Note / Text File</option>
                  <option value="CSV">Dataset / CSV</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Source Origin</label>
                <select
                  className="modal-input"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  style={{ background: "#0f172a", color: "#cbd5e1" }}
                >
                  <option value="Local Files (MCP)">Local Files (MCP)</option>
                  <option value="Web Source (arxiv.org)">Web Source (arxiv.org)</option>
                  <option value="Github (main.py)">Github Repo</option>
                  <option value="Youtube Video">Youtube Link</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">File Size / Length</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="e.g. 2.4 MB or 15:40"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Tags (comma separated)</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="e.g. transformers, attention, neural"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Brief Description</label>
                <textarea
                  className="modal-input"
                  placeholder="Summarize context details for RAG vector index mapping..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ height: "60px", resize: "none" }}
                />
              </div>

              <div className="modal-footer-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-join-session">
                  Index Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Library;

