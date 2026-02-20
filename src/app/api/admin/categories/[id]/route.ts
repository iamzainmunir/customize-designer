import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, slug, displayOrder } = body;

  await prisma.category.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(slug && { slug }),
      ...(typeof displayOrder === "number" && { displayOrder }),
    },
  });
  return NextResponse.json({ ok: true });
}
