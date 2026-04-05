import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { images } from "@/lib/schema";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const processId = formData.get("processId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    if (processId && processId !== "undefined" && processId !== "null") {
      const pid = parseInt(processId);
      if (!isNaN(pid)) {
        const [image] = await db
          .insert(images)
          .values({
            processId: pid,
            filename: file.name,
            data: dataUrl,
          })
          .returning();
        return NextResponse.json(image, { status: 201 });
      }
    }

    return NextResponse.json({ url: dataUrl, filename: file.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
