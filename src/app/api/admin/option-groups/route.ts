import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { categoryId, type, label, config } = body;
  if (!categoryId || !type || !label) {
    return NextResponse.json({ error: "Missing categoryId, type, or label" }, { status: 400 });
  }

  const maxOrder = await prisma.optionGroup.aggregate({
    where: { categoryId },
    _max: { displayOrder: true },
  });
  const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  const group = await prisma.optionGroup.create({
    data: {
      categoryId,
      type,
      label,
      config: config || {},
      displayOrder,
    },
  });
  return NextResponse.json(group);
}
