import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categoryId, customization } = body;
    if (!categoryId || !customization) {
      return NextResponse.json({ error: "Missing categoryId or customization" }, { status: 400 });
    }

    const slug = nanoid(10);
    const design = await prisma.savedDesign.create({
      data: {
        slug,
        categoryId,
        customization,
      },
    });
    return NextResponse.json({ slug: design.slug, url: `/design/${design.slug}` });
  } catch (error) {
    console.error("Save design API error:", error);
    return NextResponse.json({ error: "Failed to save design" }, { status: 500 });
  }
}
