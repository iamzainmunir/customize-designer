import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, slug } = body;
  if (!name || !slug) {
    return NextResponse.json({ error: "Missing name or slug" }, { status: 400 });
  }

  const maxOrder = await prisma.category.aggregate({
    _max: { displayOrder: true },
  });
  const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  const category = await prisma.category.create({
    data: {
      name,
      slug: slug.toLowerCase().replace(/\s+/g, "-"),
      displayOrder,
    },
  });
  return NextResponse.json(category);
}
