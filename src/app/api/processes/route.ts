import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processes, tags, processTags } from "@/lib/schema";
import { desc, like, or, eq, sql, and } from "drizzle-orm";

async function logActivity(action: string, title: string, author: string, request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    await db.run(
      sql`INSERT INTO activity_log (action, title, author, ip, user_agent, created_at) VALUES (${action}, ${title}, ${author}, ${ip}, ${userAgent}, ${new Date().toISOString()})`
    );
  } catch {
    // Don't let logging failures break the request
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase();
  const tag = searchParams.get("tag")?.toLowerCase();
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    if (tag) {
      const results = await db
        .select({
          id: processes.id,
          title: processes.title,
          author: processes.author,
          category: processes.category,
          createdAt: processes.createdAt,
          updatedAt: processes.updatedAt,
        })
        .from(processes)
        .innerJoin(processTags, eq(processTags.processId, processes.id))
        .innerJoin(tags, eq(tags.id, processTags.tagId))
        .where(eq(tags.name, tag))
        .orderBy(desc(processes.updatedAt))
        .limit(limit)
        .offset(offset);

      const withTags = await Promise.all(
        results.map(async (p) => {
          const pTags = await db
            .select({ name: tags.name })
            .from(tags)
            .innerJoin(processTags, eq(processTags.tagId, tags.id))
            .where(eq(processTags.processId, p.id));
          return { ...p, tags: pTags.map((t) => t.name) };
        })
      );

      return NextResponse.json(withTags);
    }

    const conditions = [];

    if (q) {
      const pattern = `%${q}%`;
      conditions.push(
        or(
          like(sql`lower(${processes.title})`, pattern),
          like(sql`lower(${processes.content})`, pattern),
          like(sql`lower(${processes.author})`, pattern)
        )
      );
    }

    if (category && category !== "ALL") {
      conditions.push(eq(processes.category, category));
    }

    const query = db
      .select({
        id: processes.id,
        title: processes.title,
        author: processes.author,
        category: processes.category,
        createdAt: processes.createdAt,
        updatedAt: processes.updatedAt,
      })
      .from(processes);

    const results = await (conditions.length > 0
      ? query.where(and(...conditions))
      : query
    )
      .orderBy(desc(processes.updatedAt))
      .limit(limit)
      .offset(offset);

    const withTags = await Promise.all(
      results.map(async (p) => {
        const pTags = await db
          .select({ name: tags.name })
          .from(tags)
          .innerJoin(processTags, eq(processTags.tagId, tags.id))
          .where(eq(processTags.processId, p.id));
        return { ...p, tags: pTags.map((t) => t.name) };
      })
    );

    return NextResponse.json(withTags);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, author, category, tagNames } = body;

    if (!title || !content || !author) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const now = new Date().toISOString();

    const [process] = await db
      .insert(processes)
      .values({
        title,
        content,
        author,
        category: category || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (tagNames && tagNames.length > 0) {
      for (const tagName of tagNames) {
        const normalized = tagName.toLowerCase().trim().replace(/^#/, "");
        if (!normalized) continue;

        await db.insert(tags).values({ name: normalized }).onConflictDoNothing();
        const [tag] = await db
          .select()
          .from(tags)
          .where(eq(tags.name, normalized));

        await db.insert(processTags).values({
          processId: process.id,
          tagId: tag.id,
        });
      }
    }

    // Log the activity
    await logActivity("CREATE", title, author, request);

    return NextResponse.json(process, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
