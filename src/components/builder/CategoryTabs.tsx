"use client";

interface Category {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
}

interface CategoryTabsProps {
  categories: Category[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}

export function CategoryTabs({ categories, activeSlug, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 border-b border-stone-200 pb-4">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.slug)}
          className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
            activeSlug === cat.slug
              ? "bg-amber-100 text-amber-900 border border-amber-300"
              : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-transparent"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
