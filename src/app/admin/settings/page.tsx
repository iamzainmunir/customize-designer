import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SettingsForm } from "./SettingsForm";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const settings = await prisma.siteSettings.findFirst();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-stone-800">Site Settings</h1>
      <SettingsForm
        initialData={{
          buyLinkUrl: settings?.buyLinkUrl ?? "",
          buyLinkLabel: settings?.buyLinkLabel ?? "",
          companyLogoUrl: settings?.companyLogoUrl ?? "",
          savedDesignExpiryDays: settings?.savedDesignExpiryDays ?? 30,
          sectionOrder: settings?.sectionOrder ?? '["store","branding","advanced"]',
        }}
      />
    </div>
  );
}
