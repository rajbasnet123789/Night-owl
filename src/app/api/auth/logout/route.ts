import { NextResponse } from "next/server";
import { getSessionTokenFromCookie, revokeLoginSession } from "@/lib/auth";
import { getDatabaseApiError } from "@/lib/prisma";

export async function POST() {
  try {
    const token = await getSessionTokenFromCookie();
    if (token) {
      await revokeLoginSession(token);
    }
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const dbError = getDatabaseApiError(error);
    if (dbError) {
      return NextResponse.json({ error: dbError }, { status: 503 });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
