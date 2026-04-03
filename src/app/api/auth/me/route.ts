import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDatabaseApiError } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getAuthUser();
    return NextResponse.json({ user });
  } catch (error: unknown) {
    const dbError = getDatabaseApiError(error);
    if (dbError) {
      return NextResponse.json({ error: dbError }, { status: 503 });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
