import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findFirst();
    return NextResponse.json(
      settings || {
        buyLinkUrl: null,
        buyLinkLabel: null,
        companyLogoUrl: null,
        savedDesignExpiryDays: 30,
      }
    );
  } catch (error) {
    console.error("Settings API error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
