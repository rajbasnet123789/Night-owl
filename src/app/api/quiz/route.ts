import { NextResponse } from 'next/server';

type TavilySearchResult = {
  url?: string;
  content?: string;
};

function parseLevel(input: unknown): "Easy" | "Medium" | "Hard" {
  const txt = typeof input === "string" ? input.trim().toLowerCase() : "";
  if (txt === "easy") return "Easy";
  if (txt === "hard") return "Hard";
  return "Medium";
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const topic = typeof (body as { topic?: unknown })?.topic === 'string' ? (body as { topic: string }).topic : '';
    const mode = typeof (body as { mode?: unknown })?.mode === "string" ? (body as { mode: string }).mode : "practice";
    const sessionNumber = typeof (body as { sessionNumber?: unknown })?.sessionNumber === "number"
      ? (body as { sessionNumber: number }).sessionNumber
      : 1;
    const level = parseLevel((body as { level?: unknown })?.level);
    if (!topic.trim()) {
      return NextResponse.json({ error: 'Missing topic' }, { status: 400 });
    }

    // 1. Search Tavily for recent info (via Python backend)
    const searchRes = await fetch("http://127.0.0.1:8000/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: `${topic} interview questions site:leetcode.com OR site:reddit.com` })
    });
    
    if (searchRes.ok) {
        const searchData = await searchRes.json();
        // The results field depends on what Tavily returns, usually searchData.results
        const rawResults = (searchData as { results?: unknown }).results;
        const results: TavilySearchResult[] = Array.isArray((rawResults as { results?: unknown })?.results)
          ? ((rawResults as { results: TavilySearchResult[] }).results)
          : (Array.isArray(rawResults) ? (rawResults as TavilySearchResult[]) : []);
        
        // Store top 3 results in Vector DB
        for (const resItem of results.slice(0, 3)) {
          if (resItem.content) {
                await fetch("http://127.0.0.1:8000/api/store", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: resItem.url || String(Math.random()), text: resItem.content })
                });
            }
        }
    }

    // 2. Generate Quiz based on retrieved context
    const retrieveRes = await fetch("http://127.0.0.1:8000/api/retrieve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: `${topic} interview` })
    });
    
    const contextData: { context?: string } = await retrieveRes.json();
    
    const assessmentFlag = mode === "assessment" ? "Retention checkpoint" : "Practice session";
    const prompt = [
      `Context: ${contextData.context || ""}`,
      `Topic: ${topic}`,
      `Level: ${level}`,
      `Session number: ${sessionNumber}`,
      `Mode: ${assessmentFlag}`,
      "Generate ONE structured mock question with this strict format:",
      "Question: <main question>",
      "FollowUp1: <follow-up question>",
      "FollowUp2: <follow-up question>",
      "OptimizationHint: <one optimization/improvement direction>",
      "Do not add extra sections."
    ].join("\n");
    
    const generateRes = await fetch("http://127.0.0.1:8000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    
    const evaluateData: { generated_text?: string } = await generateRes.json();

    const generated = (evaluateData.generated_text || '').replace(prompt, "").trim();
    const qMatch = generated.match(/Question:\s*(.+)/i);
    const f1Match = generated.match(/FollowUp1:\s*(.+)/i);
    const f2Match = generated.match(/FollowUp2:\s*(.+)/i);
    const optMatch = generated.match(/OptimizationHint:\s*(.+)/i);

    const mainQuestion = (qMatch?.[1] || generated || `Explain one important concept in ${topic}.`).trim();
    const followUps = [f1Match?.[1], f2Match?.[1]].filter((x): x is string => typeof x === "string" && x.trim().length > 0);
    const optimizationHint = (optMatch?.[1] || "Suggest one optimization and one trade-off in your answer.").trim();

    return NextResponse.json({
      quiz: mainQuestion,
      followUps,
      optimizationHint,
      mode: assessmentFlag,
      level,
      sessionNumber,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
