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

    if (processId) {
      const [image] = await db
        .insert(images)
        .values({
          processId: parseInt(processId),
          filename: file.name,
          data: dataUrl,
        })
        .returning();
      return NextResponse.json(image, { status: 201 });
    }

    return NextResponse.json({ url: dataUrl, filename: file.name });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
