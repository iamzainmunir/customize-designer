import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { optionGroupId, label, value } = body;
  if (!optionGroupId || !label || value === undefined) {
    return NextResponse.json({ error: "Missing optionGroupId, label, or value" }, { status: 400 });
  }

  const maxOrder = await prisma.optionValue.aggregate({
    where: { optionGroupId },
    _max: { displayOrder: true },
  });
  const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  const opt = await prisma.optionValue.create({
    data: {
      optionGroupId,
      label,
      value: String(value),
      displayOrder,
    },
  });
  return NextResponse.json(opt);
}
