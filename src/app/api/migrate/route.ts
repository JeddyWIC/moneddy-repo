import { NextResponse } from "next/server";
import { migrate } from "@/lib/migrate";

export async function POST() {
  try {
    await migrate();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
