import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const results = await db.select().from(categories).orderBy(categories.name);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name required" }, { status: 400 });
    }

    const [category] = await db
      .insert(categories)
      .values({
        name: name.trim(),
        createdAt: new Date().toISOString(),
      })
      .onConflictDoNothing()
      .returning();

    if (!category) {
      // Already exists, fetch it
      const existing = await db.select().from(categories);
      const found = existing.find(
        (c) => c.name.toLowerCase() === name.trim().toLowerCase()
      );
      return NextResponse.json(found || { name: name.trim() });
    }

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
