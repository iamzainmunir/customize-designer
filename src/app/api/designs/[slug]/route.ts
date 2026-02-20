import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const design = await prisma.savedDesign.findUnique({
      where: { slug },
      include: {
        category: {
          include: {
            productVariants: true,
            optionGroups: {
              orderBy: { displayOrder: "asc" },
              include: {
                optionValues: { orderBy: { displayOrder: "asc" } },
              },
            },
          },
        },
      },
    });
    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }
    return NextResponse.json(design);
  } catch (error) {
    console.error("Design API error:", error);
    return NextResponse.json({ error: "Failed to fetch design" }, { status: 500 });
  }
}
