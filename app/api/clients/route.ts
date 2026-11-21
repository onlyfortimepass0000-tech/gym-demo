import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Client } from "@/lib/types";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare("SELECT id, name, plan, adherence, status, last_seen, progress, risk, prs FROM clients ORDER BY id")
    .all() as Client[];
  return NextResponse.json({ clients: rows });
}
