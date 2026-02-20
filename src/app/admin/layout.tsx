import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const settings = session ? await prisma.siteSettings.findFirst() : null;

  return (
    <div className="min-h-screen bg-stone-50">
      {session && (
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            {settings?.companyLogoUrl ? (
              <Link href="/admin" className="flex items-center">
                <img src={settings.companyLogoUrl} alt="Logo" className="h-10 object-contain" />
              </Link>
            ) : (
              <Link href="/admin" className="font-semibold text-stone-800">
                Admin Panel
              </Link>
            )}
            <nav className="flex gap-4">
              <Link href="/admin" className="text-sm text-stone-600 hover:text-stone-800">
                Categories
              </Link>
              <Link href="/admin/settings" className="text-sm text-stone-600 hover:text-stone-800">
                Settings
              </Link>
              <Link href="/admin/help" className="text-sm text-stone-600 hover:text-stone-800">
                Help
              </Link>
              <Link href="/" className="text-sm text-stone-600 hover:text-stone-800">
                View Site
              </Link>
            </nav>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
