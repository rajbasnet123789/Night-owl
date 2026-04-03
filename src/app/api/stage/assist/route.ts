import { NextResponse } from "next/server";

type Body = { prompt?: unknown };

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const pyRes = await fetch("http://127.0.0.1:8000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const pyData = await pyRes.json().catch(() => ({}));
    if (!pyRes.ok) {
      const message =
        typeof (pyData as { detail?: unknown }).detail === "string"
          ? (pyData as { detail: string }).detail
          : "Assistant generation failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const generated =
      typeof (pyData as { generated_text?: unknown }).generated_text === "string"
        ? (pyData as { generated_text: string }).generated_text.trim()
        : "";

    return NextResponse.json({ generated_text: generated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
