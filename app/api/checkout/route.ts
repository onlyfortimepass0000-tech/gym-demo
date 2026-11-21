import { NextResponse } from "next/server";
import { CURRENT_MEMBER_ID, getDb } from "@/lib/db";

export async function POST() {
  const db = getDb();
  const open = db
    .prepare(
      "SELECT id, check_in FROM sessions WHERE member_id = ? AND check_out IS NULL ORDER BY check_in DESC LIMIT 1"
    )
    .get(CURRENT_MEMBER_ID) as { id: number; check_in: number } | undefined;
  if (!open) return NextResponse.json({ ok: false, error: "Not checked in" }, { status: 400 });
  const now = Date.now();
  db.prepare("UPDATE sessions SET check_out = ? WHERE id = ?").run(now, open.id);
  const mins = Math.max(10, Math.round((now - open.check_in) / 60000));
  return NextResponse.json({ ok: true, minutes: mins });
}
