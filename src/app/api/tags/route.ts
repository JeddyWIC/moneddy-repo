import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, processTags } from "@/lib/schema";
import { like, sql, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase();

  try {
    if (q) {
      const results = await db
        .select()
        .from(tags)
        .where(like(tags.name, `%${q}%`))
        .limit(10);
      return NextResponse.json(results);
    }

    const results = await db
      .select({
        id: tags.id,
        name: tags.name,
        count: sql<number>`count(${processTags.processId})`.as("count"),
      })
      .from(tags)
      .leftJoin(processTags, eq(processTags.tagId, tags.id))
      .groupBy(tags.id)
      .orderBy(sql`count DESC`)
      .limit(50);

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
