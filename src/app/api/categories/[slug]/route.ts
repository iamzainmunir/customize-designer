import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        productVariants: true,
        optionGroups: {
          orderBy: { displayOrder: "asc" },
          include: {
            optionValues: {
              orderBy: { displayOrder: "asc" },
            },
          },
        },
      },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    console.error("Category API error:", error);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}
