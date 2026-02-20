import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: "asc" },
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
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
