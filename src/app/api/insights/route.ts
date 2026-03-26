import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, processTags, processes } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. All tags with counts
    const allTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        count: sql<number>`count(${processTags.processId})`.as("count"),
      })
      .from(tags)
      .leftJoin(processTags, eq(processTags.tagId, tags.id))
      .groupBy(tags.id)
      .orderBy(sql`count DESC`);

    // 2. Tag co-occurrence: which tags appear together on the same process
    const coOccurrences = await db.all<{
      tag1: string;
      tag2: string;
      shared: number;
    }>(sql`
      SELECT t1.name as tag1, t2.name as tag2, COUNT(*) as shared
      FROM process_tags pt1
      JOIN process_tags pt2 ON pt1.process_id = pt2.process_id AND pt1.tag_id < pt2.tag_id
      JOIN tags t1 ON pt1.tag_id = t1.id
      JOIN tags t2 ON pt2.tag_id = t2.id
      GROUP BY t1.name, t2.name
      ORDER BY shared DESC
      LIMIT 100
    `);

    // 3. Category breakdown
    const categoryBreakdown = await db
      .select({
        category: processes.category,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(processes)
      .groupBy(processes.category)
      .orderBy(sql`count DESC`);

    // 4. Tags per process distribution
    const tagsPerProcess = await db.all<{
      tagCount: number;
      processCount: number;
    }>(sql`
      SELECT tag_count as tagCount, COUNT(*) as processCount
      FROM (
        SELECT pt.process_id, COUNT(*) as tag_count
        FROM process_tags pt
        GROUP BY pt.process_id
      )
      GROUP BY tag_count
      ORDER BY tag_count
    `);

    // 5. Recent tag activity (tags added in the last 30 days based on process update dates)
    const recentActivity = await db.all<{
      name: string;
      recentCount: number;
    }>(sql`
      SELECT t.name, COUNT(*) as recentCount
      FROM tags t
      JOIN process_tags pt ON pt.tag_id = t.id
      JOIN processes p ON pt.process_id = p.id
      WHERE p.updated_at >= datetime('now', '-30 days')
      GROUP BY t.name
      ORDER BY recentCount DESC
      LIMIT 15
    `);

    // 6. Total stats
    const totalProcesses = await db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(processes);

    const totalTags = await db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(tags);

    return NextResponse.json({
      tags: allTags,
      coOccurrences,
      categoryBreakdown,
      tagsPerProcess,
      recentActivity,
      stats: {
        totalProcesses: totalProcesses[0]?.count ?? 0,
        totalTags: totalTags[0]?.count ?? 0,
      },
    });
  } catch (error) {
    console.error("Insights API error:", error);
    return NextResponse.json(
      { error: "Failed to load insights" },
      { status: 500 }
    );
  }
}
