import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { categoryId, imageUrl, optionValues } = body;
  if (!categoryId) {
    return NextResponse.json({ error: "Missing categoryId" }, { status: 400 });
  }

  const variant = await prisma.productVariant.create({
    data: {
      categoryId,
      imageUrl: imageUrl || "/placeholder-product.svg",
      optionValues: optionValues || {},
    },
  });
  return NextResponse.json(variant);
}
