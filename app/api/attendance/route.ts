import { NextResponse } from "next/server";
import { getAttendance } from "@/lib/attendance";

export async function GET() {
  return NextResponse.json(getAttendance());
}
