"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddCategoryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adding, setAdding] = useState(false);

  async function add() {
    if (!name.trim()) return;
    setAdding(true);
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/\s+/g, "-"),
      }),
    });
    setName("");
    setSlug("");
    setAdding(false);
    router.refresh();
  }

  return (
    <div className="mt-6 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4">
      <h3 className="mb-3 font-medium text-stone-700">Add Category</h3>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-stone-500">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
            }}
            placeholder="e.g. Backpack"
            className="rounded border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-500">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. backpack"
            className="rounded border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={add}
          disabled={adding || !name.trim()}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          Add Category
        </button>
      </div>
    </div>
  );
}
