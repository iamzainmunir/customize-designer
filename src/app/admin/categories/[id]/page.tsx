import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { CategoryEditor } from "./CategoryEditor";

export default async function CategoryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      productVariants: { orderBy: { createdAt: "asc" } },
      optionGroups: {
        orderBy: { displayOrder: "asc" },
        include: { optionValues: { orderBy: { displayOrder: "asc" } } },
      },
    },
  });

  if (!category) notFound();

  return (
    <div>
      <Link href="/admin" className="mb-4 inline-block text-sm text-stone-600 hover:text-stone-800">
        ← Back to Categories
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-stone-800">
        Edit: {category.name}
      </h1>
      <CategoryEditor category={JSON.parse(JSON.stringify(category))} />
    </div>
  );
}
