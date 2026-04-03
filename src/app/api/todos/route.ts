import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuthUser } from "@/lib/auth";
import { getDatabaseApiError, prisma } from "@/lib/prisma";

type TodoInput = {
  id?: unknown;
  subject?: unknown;
  done?: unknown;
};

function normalizeTodos(input: unknown) {
  if (!Array.isArray(input)) return [] as Array<{ id: string; subject: string; done: boolean }>;

  const seen = new Set<string>();
  const out: Array<{ id: string; subject: string; done: boolean }> = [];

  for (const raw of input) {
    const item = (raw ?? {}) as TodoInput;
    const subject = typeof item.subject === "string" ? item.subject.trim() : "";
    if (!subject) continue;

    const baseId = typeof item.id === "string" && item.id.trim() ? item.id.trim() : `todo-${randomUUID()}`;
    let id = baseId;
    while (seen.has(id)) id = `todo-${randomUUID()}`;

    seen.add(id);
    out.push({ id, subject, done: Boolean(item.done) });
  }

  return out;
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todos = await prisma.todoSubject.findMany({
      where: { userId: user.id },
      orderBy: [{ orderId: "asc" }, { createdAt: "asc" }],
      select: { id: true, subject: true, done: true },
    });

    return NextResponse.json({ todos });
  } catch (error: unknown) {
    const dbError = getDatabaseApiError(error);
    if (dbError) {
      return NextResponse.json({ error: dbError }, { status: 503 });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { todos?: unknown };
    const normalized = normalizeTodos(body?.todos).slice(0, 100);

    await prisma.todoSubject.deleteMany({ where: { userId: user.id } });

    if (normalized.length > 0) {
      await prisma.todoSubject.createMany({
        data: normalized.map((item, index) => ({
          userId: user.id,
          subject: item.subject,
          done: item.done,
          orderId: index,
        })),
      });
    }

    const todos = await prisma.todoSubject.findMany({
      where: { userId: user.id },
      orderBy: [{ orderId: "asc" }, { createdAt: "asc" }],
      select: { id: true, subject: true, done: true },
    });

    return NextResponse.json({ todos });
  } catch (error: unknown) {
    const dbError = getDatabaseApiError(error);
    if (dbError) {
      return NextResponse.json({ error: dbError }, { status: 503 });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
