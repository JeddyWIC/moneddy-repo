import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processes, tags, processTags, images } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const processId = parseInt(id);

  try {
    const [process] = await db
      .select()
      .from(processes)
      .where(eq(processes.id, processId));

    if (!process) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const pTags = await db
      .select({ name: tags.name })
      .from(tags)
      .innerJoin(processTags, eq(processTags.tagId, tags.id))
      .where(eq(processTags.processId, processId));

    const pImages = await db
      .select({ id: images.id, filename: images.filename })
      .from(images)
      .where(eq(images.processId, processId));

    return NextResponse.json({
      ...process,
      tags: pTags.map((t) => t.name),
      images: pImages,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const processId = parseInt(id);

  try {
    const body = await request.json();
    const { title, content, author, category, tagNames } = body;

    await db
      .update(processes)
      .set({
        title,
        content,
        author,
        category: category || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(processes.id, processId));

    if (tagNames) {
      await db.delete(processTags).where(eq(processTags.processId, processId));

      for (const tagName of tagNames) {
        const normalized = tagName.toLowerCase().trim().replace(/^#/, "");
        if (!normalized) continue;

        await db.insert(tags).values({ name: normalized }).onConflictDoNothing();
        const [tag] = await db
          .select()
          .from(tags)
          .where(eq(tags.name, normalized));

        await db.insert(processTags).values({
          processId,
          tagId: tag.id,
        });
      }
    }

    await logActivity("EDIT", title, author, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const processId = parseInt(id);

  try {
    // Get process info before deleting for the log
    const [process] = await db.select().from(processes).where(eq(processes.id, processId));
    await db.delete(processes).where(eq(processes.id, processId));
    await logActivity("DELETE", process?.title || "unknown", process?.author || "unknown", request);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
