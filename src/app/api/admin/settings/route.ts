import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { buyLinkUrl, buyLinkLabel, companyLogoUrl, savedDesignExpiryDays, sectionOrder } = body;

  const existing = await prisma.siteSettings.findFirst();
  const data = {
    buyLinkUrl: buyLinkUrl ?? null,
    buyLinkLabel: buyLinkLabel ?? null,
    companyLogoUrl: companyLogoUrl ?? null,
    savedDesignExpiryDays: savedDesignExpiryDays ?? 30,
    sectionOrder: sectionOrder ?? null,
  };
  if (existing) {
    await prisma.siteSettings.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.siteSettings.create({ data });
  }
  return NextResponse.json({ ok: true });
}
