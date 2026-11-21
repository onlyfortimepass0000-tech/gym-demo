import { NextResponse } from "next/server";
import { CURRENT_MEMBER_ID, getDb } from "@/lib/db";

export async function POST() {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM sessions WHERE member_id = ? AND check_out IS NULL")
    .get(CURRENT_MEMBER_ID) as { id: number } | undefined;
  if (existing) {
    return NextResponse.json({ ok: true, sessionId: existing.id, alreadyIn: true });
  }
  const now = Date.now();
  const info = db
    .prepare("INSERT INTO sessions (member_id, check_in) VALUES (?, ?)")
    .run(CURRENT_MEMBER_ID, now);
  return NextResponse.json({ ok: true, sessionId: info.lastInsertRowid, checkInTime: now });
}
