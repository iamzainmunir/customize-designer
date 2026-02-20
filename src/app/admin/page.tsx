import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { AddCategoryForm } from "./AddCategoryForm";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      _count: { select: { productVariants: true, optionGroups: true } },
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-stone-800">Categories</h1>
      <div className="space-y-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4"
          >
            <div>
              <h2 className="font-medium text-stone-800">{cat.name}</h2>
              <p className="text-sm text-stone-500">
                {cat._count.productVariants} variants, {cat._count.optionGroups} option groups
              </p>
            </div>
            <Link
              href={`/admin/categories/${cat.id}`}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              Edit
            </Link>
          </div>
        ))}
      </div>
      <AddCategoryForm />
    </div>
  );
}
